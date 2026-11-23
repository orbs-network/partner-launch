import { isAddress, zeroAddress } from "viem";
import { chainById, legacyChainNames } from "../../config/chains";
import type { TermsSignature } from "./store";
import { ALL_NETWORKS_TERMS_TYPE, isAllNetworksTermsPayload } from "./terms-all-networks";
import { isConsistentTime, isRecord as record, TERMS_VERSION } from "./terms-policy";

export { TERMS_VERSION } from "./terms-policy";

/** Single-network acceptance, the trading app's format. Kept to validate older drafts. */
export function createTermsTypedData(chainId: number, time: bigint) {
  const chain = chainById(chainId);
  if (!chain) throw new Error("Choose a supported network before signing.");
  return {
    domain: {
      name: "PerpetualHubSignTransaction",
      version: "1",
      chainId,
      verifyingContract: zeroAddress,
    },
    types: {
      "PerpetualHub:AcceptTerms": [
        { name: "perpetualHubChain", type: "string" },
        { name: "time", type: "uint64" },
      ],
    },
    primaryType: "PerpetualHub:AcceptTerms",
    message: { perpetualHubChain: chain.name, time },
  } as const;
}

/** Drafts signed before the network names were aligned with partner-config stay valid. */
function acceptedChainName(chainId: number, name: string, signed: unknown) {
  return signed === name || (legacyChainNames[chainId] ?? []).includes(signed as string);
}

/** Validate persisted acceptance metadata; signature recovery happens before saving. */
export function isCurrentTermsSignature(
  value: unknown,
  chainId: number | null,
): value is TermsSignature {
  const chain = chainById(chainId);
  if (
    !chain ||
    !record(value) ||
    typeof value.address !== "string" ||
    !isAddress(value.address) ||
    value.address.toLowerCase() === zeroAddress ||
    typeof value.signature !== "string" ||
    !/^0x(?:[a-fA-F0-9]{128}|[a-fA-F0-9]{130})$/.test(value.signature) ||
    typeof value.message !== "string" ||
    value.message.length > 20_000 ||
    typeof value.signedAt !== "string"
  )
    return false;
  try {
    const typed: unknown = JSON.parse(value.message);
    if (record(typed) && typed.primaryType === ALL_NETWORKS_TERMS_TYPE)
      return isAllNetworksTermsPayload(typed, chain.id, value.signedAt);
    if (
      !record(typed) ||
      typed.termsVersion !== TERMS_VERSION ||
      typed.primaryType !== "PerpetualHub:AcceptTerms" ||
      !record(typed.domain) ||
      typed.domain.name !== "PerpetualHubSignTransaction" ||
      typed.domain.version !== "1" ||
      typed.domain.chainId !== chainId ||
      typeof typed.domain.verifyingContract !== "string" ||
      typed.domain.verifyingContract.toLowerCase() !== zeroAddress ||
      !record(typed.message) ||
      !acceptedChainName(chain.id, chain.name, typed.message.perpetualHubChain) ||
      !record(typed.types)
    )
      return false;
    const fields = typed.types["PerpetualHub:AcceptTerms"];
    if (
      Object.keys(typed.types).length !== 1 ||
      !Array.isArray(fields) ||
      fields.length !== 2 ||
      !record(fields[0]) ||
      fields[0].name !== "perpetualHubChain" ||
      fields[0].type !== "string" ||
      !record(fields[1]) ||
      fields[1].name !== "time" ||
      fields[1].type !== "uint64"
    )
      return false;
    return isConsistentTime(typed.message.time, value.signedAt);
  } catch {
    return false;
  }
}
