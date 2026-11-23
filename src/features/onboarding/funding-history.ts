import { formatUnits } from "viem";
import { FUNDING_CHAIN_ID, FUNDING_TOKEN_DECIMALS } from "../../config/funding";
import type { OnboardingDraft } from "./state/types";
import { parseFixedFundingAmount } from "./funding-amount";
import {
  isFundingConfirmation,
  type FundingConfirmation,
} from "./funding-confirmation";

interface FundingHistorySource {
  partnerName: string;
  fundingConfirmations?: unknown;
  fundingConfirmation?: unknown;
}

/** Preserve the first valid fixed-amount confirmation from older saved histories. */
export function getFundingConfirmations(
  draft: FundingHistorySource,
): FundingConfirmation[] {
  const source = Array.isArray(draft.fundingConfirmations)
    ? draft.fundingConfirmations
    : [];
  const confirmation = source.find(
    (item): item is FundingConfirmation =>
      isFundingConfirmation(item) && item.partnerId === draft.partnerName,
  );
  if (confirmation) return [confirmation];
  const legacy = draft.fundingConfirmation;
  return isFundingConfirmation(legacy) && legacy.partnerId === draft.partnerName
    ? [legacy]
    : [];
}

/** This is a demo total, never an on-chain balance. */
export function getFundingTotal(draft: FundingHistorySource): string {
  const units = getFundingConfirmations(draft).reduce(
    (total, confirmation) =>
      total + parseFixedFundingAmount(confirmation.amount),
    0n,
  );
  return formatUnits(units, FUNDING_TOKEN_DECIMALS);
}

/** Accept exactly one fixed-amount confirmation, never an additional deposit. */
export function appendFundingConfirmation(
  draft: FundingHistorySource & Pick<OnboardingDraft, "fundingByChain">,
  confirmation: FundingConfirmation,
): FundingConfirmation[] | null {
  const history = getFundingConfirmations(draft);
  if (
    history.length > 0 ||
    !isFundingConfirmation(confirmation) ||
    confirmation.partnerId !== draft.partnerName ||
    confirmation.amount !==
      draft.fundingByChain[FUNDING_CHAIN_ID]?.depositAmount.trim() ||
    Object.values(draft.fundingByChain).some(
      (funding) => funding.deposit?.status === "pending",
    )
  )
    return null;
  return [confirmation];
}
