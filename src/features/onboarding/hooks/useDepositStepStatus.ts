import { useEffect } from "react";
import { skipToken, useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { findConfirmedDepositStep } from "../find-deposit-step";
import { isSetupSubmission, setupHash } from "../setup-submission";
import { useOnboardingStore } from "../store";
import type { OnboardingDraft } from "../state/types";

export function useDepositStepStatus(draft: OnboardingDraft) {
  const wallet = useAccount();
  const address = wallet.status === "connected" ? wallet.address : undefined;
  const chainId = draft.chainIds.length === 1 ? draft.chainIds[0] : null;
  const enabled = !!address && chainId !== null && !!draft.partnerName;
  const query = useQuery({
    queryKey: ["deposit-step", address?.toLowerCase() ?? null, draft.partnerName, chainId, setupHash(draft), draft.setupSubmission ?? null, draft.depositStepConfirmations ?? null],
    queryFn: enabled && address ? async () => await findConfirmedDepositStep(draft, address) ?? null : skipToken,
    retry: false,
    staleTime: 0,
  });
  useEffect(() => {
    const confirmation = query.data;
    if (!address || !confirmation || confirmation.submission.address.toLowerCase() !== address.toLowerCase()) return;
    useOnboardingStore.getState().rememberDepositStepConfirmation(confirmation);
  }, [address, query.data]);
  return {
    confirmed: !!query.data,
    unchanged: !!query.data && isSetupSubmission(draft.setupSubmission, draft) && draft.setupSubmission.address.toLowerCase() === query.data.submission.address.toLowerCase(),
    checking: enabled && (query.isPending || (query.isFetching && !query.data)),
    error: query.isError,
  };
}
