import { zeroAddress } from "viem";
import { chainById, walletChains } from "../../config/chains";
import {
  isConsistentTime,
  isRecord,
  TERMS_DOMAIN_NAME,
  TERMS_VERSION,
} from "./terms-policy";

/**
 * One wallet confirmation that accepts the terms for every selected network,
 * signed on whichever supported network the wallet is already using.
 */
export const ALL_NETWORKS_TERMS_TYPE = "PerpetualHub:AcceptPartnerTerms";

const fields = [
  { name: "partner", type: "string" },
  { name: "perpetualHubChains", type: "string[]" },
  { name: "chainIds", type: "uint256[]" },
  { name: "termsVersion", type: "string" },
  { name: "time", type: "uint64" },
] as const;

export const isWalletChain = (id: number | undefined) =>
  walletChains.some((chain) => chain.id === id);

export function createAllNetworksTermsTypedData({
  partner,
  chainIds,
  signingChainId,
  time,
}: {
  partner: string;
  chainIds: readonly number[];
  signingChainId: number;
  time: bigint;
}) {
  const chains = chainIds.map(chainById);
  if (!chains.length || chains.some((chain) => !chain))
    throw new Error("Choose a supported network before signing.");
  if (!isWalletChain(signingChainId))
    throw new Error("Switch your wallet to a supported network, then try again.");
  return {
    domain: {
      name: TERMS_DOMAIN_NAME,
      version: "1",
      chainId: signingChainId,
      verifyingContract: zeroAddress,
    },
    types: { [ALL_NETWORKS_TERMS_TYPE]: fields },
    primaryType: ALL_NETWORKS_TERMS_TYPE,
    message: {
      partner,
      perpetualHubChains: chains.map((chain) => chain!.name),
      chainIds: chainIds.map(BigInt),
      termsVersion: TERMS_VERSION,
      time,
    },
  } as const;
}

/** Validate a stored all-networks payload for one of the networks it covers. */
export function isAllNetworksTermsPayload(
  typed: Record<string, unknown>,
  chainId: number,
  signedAt: string,
) {
  const { domain, message, types } = typed;
  if (
    !isRecord(domain) ||
    domain.name !== TERMS_DOMAIN_NAME ||
    domain.version !== "1" ||
    typeof domain.chainId !== "number" ||
    !isWalletChain(domain.chainId) ||
    typeof domain.verifyingContract !== "string" ||
    domain.verifyingContract.toLowerCase() !== zeroAddress ||
    !isRecord(types) ||
    Object.keys(types).length !== 1 ||
    JSON.stringify(types[ALL_NETWORKS_TERMS_TYPE]) !== JSON.stringify(fields) ||
    !isRecord(message) ||
    typeof message.partner !== "string" ||
    !message.partner ||
    message.termsVersion !== TERMS_VERSION ||
    !Array.isArray(message.chainIds) ||
    !Array.isArray(message.perpetualHubChains) ||
    message.chainIds.length !== message.perpetualHubChains.length
  )
    return false;
  const names: unknown[] = message.perpetualHubChains;
  const ids = message.chainIds.map(Number);
  const covered = ids.indexOf(chainId);
  return (
    covered >= 0 &&
    message.chainIds.every((id) => typeof id === "string" && /^\d+$/.test(id)) &&
    new Set(ids).size === ids.length &&
    ids.every((id, index) => chainById(id)?.name === names[index]) &&
    isConsistentTime(message.time, signedAt)
  );
}
