import type { Address } from "viem";
import { onboardingStepOrder } from "./onboarding-steps";
import type { OnboardingDraft } from "./state/types";
import { isSetupSubmission } from "./setup-submission";
import { getStepError } from "./validation";
import { hasSetupRequestReceipt } from "./setup-request-receipt";

/** Completion requires valid setup and a currently connected confirmed wallet. */
export function getSetupCompletionError(
  draft: OnboardingDraft,
  wallet: { status: string; address?: Address },
): string | undefined {
  for (const step of onboardingStepOrder) {
    const error = getStepError(step, draft);
    if (error) return error;
  }
  if (!isSetupSubmission(draft.setupSubmission, draft)) return "Sign the deposit confirmation and submit your setup to continue.";
  if (wallet.status !== "connected" || !wallet.address || draft.setupSubmission.address.toLowerCase() !== wallet.address.toLowerCase())
    return "Reconnect the wallet you saved this setup with to continue.";
  if (!hasSetupRequestReceipt(draft) || draft.setupRequestReceipt?.notification !== "telegram") return "Send your setup to the team before finishing.";
}
