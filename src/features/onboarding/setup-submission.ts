import { isAddress, keccak256, stringToHex, zeroAddress, type Address, type Hex } from "viem";
import type { OnboardingDraft } from "./state/types";
import { TERMS_VERSION } from "./terms-policy";
import { chainById } from "../../config/chains";

export interface SetupSubmission {
  address: Address;
  signature: Hex;
  message: string;
  signedAt: string;
  setupHash: Hex;
  termsVersion: string;
  includesDepositConfirmation?: true;
}

/** Bind the one signature to the complete requested setup, separately from payment. */
export function setupHash(draft: OnboardingDraft): Hex {
  return keccak256(stringToHex(JSON.stringify({
    partnerId: draft.partnerName, displayName: draft.displayName, launchPath: draft.launchPath,
    chainIds: draft.chainIds, origins: draft.origins, revenueWallet: draft.revenueWallet,
    ...(draft.builderFeeTenthsBps === undefined
      ? { feeCapBps: draft.feeCapBps, requestedCreatorShareBps: draft.requestedCreatorShareBps }
      : { feeModel: "per-order-builder-fee", builderFeeTenthsBps: draft.builderFeeTenthsBps }),
    brandColor: draft.brandColor, logoDataUrl: draft.logoDataUrl, termsVersion: TERMS_VERSION,
  })));
}

export interface SetupMessageDetails {
  projectName: string;
  partnerId: string;
  chainId: number;
  setupHash: Hex;
}

function formatSetupMessage(details: SetupMessageDetails, signedAt: string, includeDeposit: boolean): string {
  const chain = chainById(details.chainId);
  return [
    includeDeposit ? "dPERPS deposit and setup request (v2)" : "dPERPS setup request (v1)", "", `Project: ${details.projectName}`,
    `Partner ID: ${details.partnerId}`, `Network: ${chain?.name ?? "Unknown"} (${details.chainId})`,
    ...(includeDeposit ? ["Deposit confirmation: 100 USDC"] : []),
    `Setup details hash: ${details.setupHash}`, `Terms version: ${TERMS_VERSION}`, `Created at: ${signedAt}`, "",
    includeDeposit ? "I accept the dPERPS terms, confirm these setup details and confirm the 100 USDC deposit step." : "I accept the dPERPS terms and confirm these setup details.",
    "This saves my setup only. It does not make a deposit or approve token spending.",
  ].join("\n");
}

function setupMessageDetails(draft: OnboardingDraft): SetupMessageDetails {
  return { projectName: draft.displayName || draft.partnerName, partnerId: draft.partnerName, chainId: draft.chainIds[0], setupHash: setupHash(draft) };
}

/** Keep existing saved request messages byte-for-byte unchanged. */
export function createSetupMessage(draft: OnboardingDraft, signedAt: string): string {
  return formatSetupMessage(setupMessageDetails(draft), signedAt, false);
}

export function createDepositAndSetupMessage(draft: OnboardingDraft, signedAt: string): string {
  return createDepositAndSetupMessageFromDetails(setupMessageDetails(draft), signedAt);
}

/** Reconstruct an original compact deposit-step proof without duplicating its draft/logo. */
export function createDepositAndSetupMessageFromDetails(details: SetupMessageDetails, signedAt: string): string {
  return formatSetupMessage(details, signedAt, true);
}

/** Structure only; callers verify ECDSA before trusting a restored proof. */
export function isSetupSubmissionProof(value: unknown): value is SetupSubmission {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (record.includesDepositConfirmation !== undefined && record.includesDepositConfirmation !== true) return false;
  if (typeof record.address !== "string" || !isAddress(record.address) || record.address.toLowerCase() === zeroAddress ||
    typeof record.signature !== "string" || !/^0x(?:[a-fA-F0-9]{128}|[a-fA-F0-9]{130})$/.test(record.signature) ||
    typeof record.signedAt !== "string" || record.termsVersion !== TERMS_VERSION ||
    typeof record.setupHash !== "string" || !/^0x[a-fA-F0-9]{64}$/.test(record.setupHash) || typeof record.message !== "string") return false;
  const time = Date.parse(record.signedAt);
  return Number.isFinite(time) && new Date(time).toISOString() === record.signedAt && time <= Date.now() + 300_000;
}

export function isSetupSubmission(value: unknown, draft: OnboardingDraft): value is SetupSubmission {
  if (draft.chainIds.length !== 1 || !isSetupSubmissionProof(value)) return false;
  const message = value.includesDepositConfirmation ? createDepositAndSetupMessage : createSetupMessage;
  return value.setupHash === setupHash(draft) && value.message === message(draft, value.signedAt);
}
