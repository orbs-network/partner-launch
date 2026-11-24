import type { Address } from "viem";
import { onboardingStepOrder } from "./onboarding-steps";
import type { OnboardingDraft } from "./state/types";
import { isSetupSubmission } from "./setup-submission";
import { getStepError } from "./validation";
import { hasSetupRequestReceipt } from "./setup-request-receipt";

/** Completion requires valid setup, delivery, and the wallet used to submit it. */
export function getSetupCompletionError(
  draft: OnboardingDraft,
  wallet: { status: string; address?: Address },
): string | undefined {
  for (const step of onboardingStepOrder) {
    const error = getStepError(step, draft);
    if (error) return error;
  }
  if (!hasSetupRequestReceipt(draft) || draft.setupRequestReceipt?.notification !== "telegram") return "Send your setup to the team before finishing.";
  const owner = draft.setupRequestReceipt.verification === "unsigned" ? draft.setupRequestReceipt.ownerWallet :
    isSetupSubmission(draft.setupSubmission, draft) ? draft.setupSubmission.address : undefined;
  if (wallet.status !== "connected" || !wallet.address || owner?.toLowerCase() !== wallet.address.toLowerCase())
    return "Reconnect the wallet you saved this setup with to continue.";
}
