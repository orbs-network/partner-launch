import { useEffect } from "react";
import {
  FUNDING_AMOUNT,
  FUNDING_CHAIN_ID,
} from "../../../config/funding";
import { isFundingStepComplete } from "../placeholder-funding";
import { getFundingConfirmations, getFundingTotal } from "../funding-history";
import { getChainFunding, useOnboardingStore } from "../store";

export function useFundingState() {
  const fundingByChain = useOnboardingStore((state) => state.fundingByChain);
  const confirmation = useOnboardingStore((state) => state.fundingConfirmation);
  const fundingConfirmations = useOnboardingStore(
    (state) => state.fundingConfirmations,
  );
  const partnerName = useOnboardingStore((state) => state.partnerName);
  const confirmed = useOnboardingStore(isFundingStepComplete);
  const history = getFundingConfirmations({
    fundingConfirmation: confirmation,
    fundingConfirmations,
    partnerName,
  });
  const total = useOnboardingStore(getFundingTotal);
  const setAmount = useOnboardingStore((state) => state.setDepositAmount);
  const { deposit, depositAmount } = getChainFunding(
    { fundingByChain },
    FUNDING_CHAIN_ID,
  );
  useEffect(() => {
    if (depositAmount !== FUNDING_AMOUNT && deposit?.status !== "pending")
      setAmount(FUNDING_AMOUNT, FUNDING_CHAIN_ID);
  }, [depositAmount, deposit?.status, setAmount]);
  const pendingDeposits = Object.values(fundingByChain).flatMap((item) =>
    item.deposit?.status === "pending" ? [item.deposit] : [],
  );
  return {
    amount: FUNDING_AMOUNT,
    deposit,
    confirmation,
    history,
    total,
    pendingDeposits,
    pending: pendingDeposits.length > 0,
    confirmed,
  };
}
