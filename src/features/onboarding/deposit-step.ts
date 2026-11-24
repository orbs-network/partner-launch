import { chainById } from "../../config/chains";
import { isPartnerIdFormat, MAX_RETAINED_DISPLAY_NAME_LENGTH } from "./dex-identity";
import { createDepositAndSetupMessageFromDetails, isSetupSubmission, isSetupSubmissionProof, type SetupSubmission } from "./setup-submission";
import type { OnboardingDraft } from "./state/types";

/** A network-scoped mock acknowledgement, never a payment or spending receipt. */
export interface DepositStepConfirmation {
  partnerId: string;
  chainId: number;
  projectName: string;
  submission: SetupSubmission;
}

/** Reconstruct exact original v2 or v3 bytes; signature recovery remains the caller's responsibility. */
export function isDepositStepConfirmation(value: unknown): value is DepositStepConfirmation {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  if (typeof item.partnerId !== "string" || item.partnerId.length < 3 || item.partnerId.length > 40 ||
    !isPartnerIdFormat(item.partnerId) ||
    typeof item.chainId !== "number" || !Number.isSafeInteger(item.chainId) || !chainById(item.chainId) ||
    typeof item.projectName !== "string" || !item.projectName || item.projectName.length > MAX_RETAINED_DISPLAY_NAME_LENGTH ||
    !isSetupSubmissionProof(item.submission) || item.submission.includesDepositConfirmation !== true) return false;
  return item.submission.message === createDepositAndSetupMessageFromDetails({
    partnerId: item.partnerId, chainId: item.chainId, projectName: item.projectName, setupHash: item.submission.setupHash,
  }, item.submission.signedAt, item.submission.collateral) &&
    (!item.submission.collateral || item.submission.collateral.chainId === item.chainId);
}

export function depositStepConfirmation(draft: OnboardingDraft): DepositStepConfirmation | undefined {
  if (!isSetupSubmission(draft.setupSubmission, draft) || draft.setupSubmission.includesDepositConfirmation !== true) return;
  const record = {
    partnerId: draft.partnerName, chainId: draft.chainIds[0], projectName: draft.displayName || draft.partnerName,
    submission: draft.setupSubmission,
  };
  return isDepositStepConfirmation(record) ? record : undefined;
}

/** Validate only an explicitly stored history; do not derive fields while reading immutable copies. */
export function sanitizeDepositStepConfirmations(value: unknown): DepositStepConfirmation[] | undefined {
  if (!Array.isArray(value)) return;
  const byScope = new Map<string, DepositStepConfirmation>();
  for (const candidate of value) {
    if (!isDepositStepConfirmation(candidate)) continue;
    const key = `${candidate.partnerId}:${candidate.chainId}:${candidate.submission.address.toLowerCase()}`;
    const previous = byScope.get(key);
    if (previous && Date.parse(previous.submission.signedAt) > Date.parse(candidate.submission.signedAt)) continue;
    const proof = candidate.submission;
    byScope.set(key, {
      partnerId: candidate.partnerId, chainId: candidate.chainId, projectName: candidate.projectName,
      submission: { address: proof.address, signature: proof.signature, message: proof.message, signedAt: proof.signedAt, setupHash: proof.setupHash, termsVersion: proof.termsVersion, includesDepositConfirmation: true, ...(proof.collateral ? { collateral: proof.collateral } : {}) },
    });
  }
  return byScope.size ? [...byScope.values()] : undefined;
}

/** Capture current consent before an edit invalidates the request that also carried it. */
export function retainDepositStepConfirmations(draft: OnboardingDraft): DepositStepConfirmation[] | undefined {
  const current = depositStepConfirmation(draft);
  return sanitizeDepositStepConfirmations([...(draft.depositStepConfirmations ?? []), ...(current ? [current] : [])]);
}
