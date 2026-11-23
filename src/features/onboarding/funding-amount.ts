import {
  FUNDING_AMOUNT,
  FUNDING_TOKEN_DECIMALS,
  FUNDING_TOKEN_SYMBOL,
  MIN_FUNDING_AMOUNT,
} from "../../config/funding";
import { parseFundingAmount } from "./funding";

/** The demo onboarding requires one fixed amount, compared in exact token units. */
export function parseFixedFundingAmount(
  value: string,
  decimals: 6 | 18 = FUNDING_TOKEN_DECIMALS,
): bigint {
  const units = parseFundingAmount(value, decimals);
  if (units !== parseFundingAmount(FUNDING_AMOUNT, decimals)) {
    throw new Error(
      `The funding amount is fixed at ${FUNDING_AMOUNT} ${FUNDING_TOKEN_SYMBOL}.`,
    );
  }
  return units;
}

/** Legacy minimum retained for the dormant live-funding implementation. */
export function parseMinimumFundingAmount(
  value: string,
  decimals: 6 | 18 = FUNDING_TOKEN_DECIMALS,
): bigint {
  const units = parseFundingAmount(value, decimals);
  if (units < parseFundingAmount(MIN_FUNDING_AMOUNT, decimals)) {
    throw new Error(
      `Enter at least ${MIN_FUNDING_AMOUNT} ${FUNDING_TOKEN_SYMBOL}.`,
    );
  }
  return units;
}
