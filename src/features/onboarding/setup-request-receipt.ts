import type { OnboardingDraft } from "./state/types";
import { isSetupSubmission, setupHash } from "./setup-submission";
import { TERMS_VERSION } from "./terms-policy";

export interface SetupRequestReceipt {
  requestId: string;
  partnerId: string;
  status: "pending-review";
  receivedAt: string;
  mock: true;
  transport?: "local";
  notification?: "telegram";
}

/** Acknowledgement bound to the signed setup; local functions mark their transport. */
export interface SavedSetupRequestReceipt extends SetupRequestReceipt {
  setupHash: string;
}

export function isSetupRequestReceipt(value: unknown, partnerId: string): value is SetupRequestReceipt {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const receipt = value as Record<string, unknown>;
  if (typeof receipt.requestId !== "string" || !receipt.requestId.trim() || receipt.requestId.length > 200 ||
    receipt.partnerId !== partnerId || receipt.status !== "pending-review" || receipt.mock !== true ||
    (receipt.transport !== undefined && receipt.transport !== "local") ||
    (receipt.notification !== undefined && receipt.notification !== "telegram") ||
    typeof receipt.receivedAt !== "string") return false;
  const time = Date.parse(receipt.receivedAt);
  return Number.isFinite(time) && new Date(time).toISOString() === receipt.receivedAt;
}

export function isSavedSetupRequestReceipt(value: unknown, draft: OnboardingDraft): value is SavedSetupRequestReceipt {
  return isSetupRequestReceipt(value, draft.partnerName) && "setupHash" in value &&
    value.setupHash === setupHash(draft) && draft.termsAcceptedVersion === TERMS_VERSION &&
    isSetupSubmission(draft.setupSubmission, draft);
}

export function hasSetupRequestReceipt(draft: OnboardingDraft): boolean {
  return isSavedSetupRequestReceipt(draft.setupRequestReceipt, draft);
}
