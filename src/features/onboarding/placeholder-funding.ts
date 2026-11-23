import { getFundingConfirmations } from "./funding-history";
import type { OnboardingDraft } from "./state/types";

export {
  createFundingMessage,
  isFundingConfirmation,
} from "./funding-confirmation";
export type { FundingConfirmation } from "./funding-confirmation";

export function isFundingStepComplete(
  draft: Pick<
    OnboardingDraft,
    | "fundingConfirmations"
    | "fundingConfirmation"
    | "partnerName"
    | "fundingByChain"
  >,
): boolean {
  return (
    getFundingConfirmations(draft).length > 0 &&
    !Object.values(draft.fundingByChain).some(
      (funding) => funding.deposit?.status === "pending",
    )
  );
}

/** The deposit signer owns the saved setup; the revenue wallet is independent. */
export function getFundingSigner(draft: Pick<OnboardingDraft, "fundingConfirmations" | "fundingConfirmation" | "partnerName">) {
  return getFundingConfirmations(draft).at(-1)?.address;
}
