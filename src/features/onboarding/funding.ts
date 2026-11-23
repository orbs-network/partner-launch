import {
  getAddress,
  isAddress,
  parseUnits,
  zeroAddress,
  type Address,
} from "viem";

export interface FundingTarget {
  partnerId: string;
  chainId: number;
  apiBaseUrl: string;
  rollup: Address;
  token: Address;
  decimals: 6 | 18;
  hedger: Address;
}

export const depositAbi = [
  {
    type: "function",
    name: "depositForAccount",
    stateMutability: "nonpayable",
    inputs: [
      { name: "accountId", type: "bytes32" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
] as const;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonzeroAddress(value: unknown): value is Address {
  return (
    typeof value === "string" &&
    isAddress(value) &&
    value.toLowerCase() !== zeroAddress
  );
}

export function parseFundingTargets(raw: string | undefined): {
  targets: FundingTarget[];
  error?: string;
} {
  if (!raw?.trim()) return { targets: [] };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed))
      throw new Error("Funding targets must be an array.");
    const keys = new Set<string>();
    const targets = parsed.map((value: unknown): FundingTarget => {
      if (
        !record(value) ||
        typeof value.partnerId !== "string" ||
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.partnerId) ||
        typeof value.chainId !== "number" ||
        !Number.isSafeInteger(value.chainId) ||
        value.chainId <= 0 ||
        typeof value.apiBaseUrl !== "string" ||
        !nonzeroAddress(value.rollup) ||
        !nonzeroAddress(value.token) ||
        !nonzeroAddress(value.hedger) ||
        (value.decimals !== 6 && value.decimals !== 18)
      ) {
        throw new Error(
          "Each funding target needs a partner ID, chain, backend URL, contract, token, decimals and hedger.",
        );
      }
      const api = new URL(value.apiBaseUrl);
      const local = ["localhost", "127.0.0.1", "[::1]"].includes(api.hostname);
      if (
        (api.protocol !== "https:" && !(local && api.protocol === "http:")) ||
        api.username ||
        api.password ||
        api.search ||
        api.hash ||
        api.pathname !== "/"
      ) {
        throw new Error(
          "Funding backend URLs must be HTTPS origins (HTTP localhost is allowed for development).",
        );
      }
      const key = `${value.partnerId}:${value.chainId}`;
      if (keys.has(key))
        throw new Error(
          "A partner and network can have only one funding target.",
        );
      keys.add(key);
      return {
        partnerId: value.partnerId,
        chainId: value.chainId,
        apiBaseUrl: api.origin,
        rollup: getAddress(value.rollup),
        token: getAddress(value.token),
        decimals: value.decimals,
        hedger: getAddress(value.hedger),
      };
    });
    return { targets };
  } catch (error) {
    return {
      targets: [],
      error:
        error instanceof Error
          ? error.message
          : "Funding configuration is invalid.",
    };
  }
}

export function fundingFingerprint(target: FundingTarget): string {
  return [
    target.partnerId,
    target.chainId,
    target.apiBaseUrl,
    target.rollup.toLowerCase(),
    target.token.toLowerCase(),
    target.decimals,
    target.hedger.toLowerCase(),
  ].join("|");
}

export function parseFundingAmount(
  value: string,
  decimals: 6 | 18 = 6,
): bigint {
  const amount = value.trim();
  if (amount.length > 40 || !/^\d+(?:\.\d{1,6})?$/.test(amount)) {
    throw new Error("Enter a positive amount with up to 6 decimal places.");
  }
  const units = parseUnits(amount, decimals);
  if (units <= 0n || units >= 2n ** 256n)
    throw new Error("Enter an amount greater than zero.");
  return units;
}

/** A browser draft cannot establish which account the live deposit listener credits. */
export function assertFundingRegistry(
  registry: unknown,
  target: FundingTarget,
): void {
  const key = `${target.partnerId}:${target.chainId}`;
  const entries =
    record(registry) && Array.isArray(registry.entries) ? registry.entries : [];
  const row: unknown = entries.find(
    (entry: unknown) => record(entry) && entry.partnerChainKey === key,
  );
  const startup = record(row) && record(row.startup) ? row.startup : undefined;
  const persisted =
    record(row) && record(row.persisted) ? row.persisted : undefined;
  if (
    startup?.activeRuntime !== true ||
    persisted?.activeRuntime !== true ||
    startup.restartRequired !== false ||
    persisted.restartRequired !== false ||
    typeof startup.entryHash !== "string" ||
    !startup.entryHash ||
    startup.entryHash !== persisted.entryHash
  ) {
    throw new Error(
      "Your partner account is not active on this network. Contact the dPERPS team before funding.",
    );
  }
  for (const projection of [startup, persisted]) {
    const entry = projection.entry;
    const sameAddress = (value: unknown, expected: Address) =>
      typeof value === "string" &&
      value.toLowerCase() === expected.toLowerCase();
    if (
      !record(entry) ||
      entry.status !== "enabled" ||
      entry.partnerId !== target.partnerId ||
      String(entry.chainId) !== String(target.chainId) ||
      !sameAddress(entry.contractAddress, target.rollup) ||
      !sameAddress(entry.verifyingContractAddress, target.rollup) ||
      !sameAddress(entry.collateralAddress, target.token) ||
      entry.collateralDecimals !== target.decimals ||
      !record(entry.roles) ||
      !sameAddress(entry.roles.hedger, target.hedger)
    ) {
      throw new Error(
        "Funding details do not match the active partner account. Contact the dPERPS team to refresh the configuration.",
      );
    }
  }
}

export async function verifyFundingRegistry(
  target: FundingTarget,
  fetcher: typeof fetch = fetch,
): Promise<void> {
  const response = await fetcher(
    `${target.apiBaseUrl}/api/v1/admin/partner-chains`,
    {
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    },
  );
  if (!response.ok)
    throw new Error(
      "Could not verify your partner account. Try again before funding.",
    );
  assertFundingRegistry(await response.json(), target);
}

export function fundingError(error: unknown): string {
  if (
    error &&
    typeof error === "object" &&
    "shortMessage" in error &&
    typeof error.shortMessage === "string"
  ) {
    return error.shortMessage;
  }
  return error instanceof Error
    ? error.message
    : "Funding could not be completed. Please try again.";
}
