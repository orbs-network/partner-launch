import { verifyMessage, type Address, type Hex } from "viem";
import { createDepositAndSetupMessage, isSetupSubmission, setupHash, type SetupSubmission } from "./setup-submission";
import type { SetupRequestReceipt } from "./setup-request-receipt";
import type { OnboardingDraft } from "./state/types";
import { TERMS_VERSION } from "./terms-policy";
import { validateBuilderFee } from "./builder-fee";

/** Exercise wallet confirmation only; this does not submit a transfer or approve spending. */
export async function mockDeposit(draft: OnboardingDraft, address: Address, sign: (message: string) => Promise<Hex>): Promise<SetupSubmission> {
  const feeError = validateBuilderFee(draft.builderFeeTenthsBps);
  if (feeError) throw new Error(feeError);
  const signedAt = new Date().toISOString();
  const message = createDepositAndSetupMessage(draft, signedAt);
  const signature = await sign(message);
  if (!await verifyMessage({ address, message, signature })) throw new Error("We couldn’t verify your signature. Please try again.");
  return { address, message, signature, signedAt, setupHash: setupHash(draft), termsVersion: TERMS_VERSION, includesDepositConfirmation: true };
}

/** Local acknowledgement only: no setup endpoint, server storage or notification. */
export async function mockSetupRequest(draft: OnboardingDraft): Promise<SetupRequestReceipt> {
  if (draft.termsAcceptedVersion !== TERMS_VERSION || !isSetupSubmission(draft.setupSubmission, draft))
    throw new Error("Confirm your setup in your wallet before submitting.");
  return { requestId: crypto.randomUUID(), partnerId: draft.partnerName, status: "pending-review", receivedAt: new Date().toISOString(), mock: true, transport: "local" };
}
