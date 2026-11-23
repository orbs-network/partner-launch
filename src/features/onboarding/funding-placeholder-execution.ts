import { verifyMessage, type Address, type Hex } from "viem";
import { FUNDING_CHAIN_ID } from "../../config/funding";
import { parseFixedFundingAmount } from "./funding-amount";
import type { FundingIntent } from "./funding-execution";
import { createFundingMessage, getFundingSigner, isFundingStepComplete } from "./placeholder-funding";
import { getChainFunding, getPendingDeposit } from "./state/draft";
import type { OnboardingState } from "./state/types";
import { getStepError } from "./validation";
import { FUNDING_STEP, onboardingSteps } from "./onboarding-steps";

export type ConfirmationPhase = "signature" | "verification";
interface WalletSnapshot { status: string; address?: Address; chainId?: number }

/** Confirm the deposit reference after checkbox acceptance; never submit a transaction. */
export async function confirmFundingSetup(intent: FundingIntent, controls: {
  getDraft: () => OnboardingState;
  getWallet: () => WalletSnapshot;
  isMounted: () => boolean;
  signFunding: (message: string, signer: Address) => Promise<Hex>;
  setPhase: (phase: ConfirmationPhase) => void;
}) {
  const { getDraft, getWallet, isMounted, signFunding, setPhase } = controls;
  const account = getWallet();
  if (account.status !== "connected" || !account.address)
    throw new Error("Connect your wallet before confirming this step.");
  const signer = account.address;
  const snapshot = getDraft();
  const alreadyFunded = isFundingStepComplete(snapshot);
  const assertCurrent = (chainId?: number) => {
    const wallet = getWallet();
    const draft = getDraft();
    if (!isMounted() || wallet.status !== "connected" ||
      wallet.address?.toLowerCase() !== signer.toLowerCase() ||
      (chainId !== undefined && wallet.chainId !== chainId) ||
      draft.revision !== intent.revision || draft.partnerName !== intent.partnerId ||
      getChainFunding(draft, FUNDING_CHAIN_ID).depositAmount !== intent.amount ||
      getPendingDeposit(draft) || isFundingStepComplete(draft) !== alreadyFunded)
      throw new Error("Your wallet or setup changed. Check your details and try again.");
  };
  assertCurrent();
  parseFixedFundingAmount(intent.amount);
  const invalid = onboardingSteps.slice(0, FUNDING_STEP)
    .map((_, step) => getStepError(step, snapshot)).find(Boolean);
  if (invalid) throw new Error(invalid);
  if (alreadyFunded) {
    if (getFundingSigner(snapshot)?.toLowerCase() !== signer.toLowerCase())
      throw new Error("Reconnect the wallet you confirmed the deposit with to finish setup.");
    return;
  }
  const signedAt = new Date().toISOString();
  const amount = intent.amount.trim();
  const message = createFundingMessage({ partnerId: intent.partnerId, amount, signedAt });
  setPhase("signature");
  const signature = await signFunding(message, signer);
  assertCurrent();
  setPhase("verification");
  const verified = await verifyMessage({ address: signer, message, signature });
  assertCurrent();
  if (!verified) throw new Error("We couldn’t verify the signature. Reconnect your wallet and try again.");
  getDraft().setFundingConfirmation({
    mode: "signature-placeholder", partnerId: intent.partnerId, amount,
    address: signer, signature, message, signedAt,
  });
}
