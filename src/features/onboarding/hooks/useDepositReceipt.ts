import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import { getChainFunding, useOnboardingStore, type Deposit } from "../store";

/** Observe persisted payments, including replaced transactions and old networks. */
export function useDepositReceipt(deposit: Deposit) {
  const client = usePublicClient({ chainId: deposit.chainId });
  const setDeposit = useOnboardingStore((state) => state.setDeposit);
  const queryClient = useQueryClient();
  const receipt = useQuery({
    queryKey: ["onboarding", "deposit-receipt", deposit.chainId, deposit.hash],
    enabled: deposit.status === "pending" && !!client,
    retry: 1,
    refetchInterval: deposit.status === "pending" ? 4_000 : false,
    queryFn: async () => {
      if (!client) return null;
      const result = await client.waitForTransactionReceipt({
        hash: deposit.hash,
        timeout: 20_000,
        onReplaced: ({ reason, transactionReceipt }) => {
          const current = getChainFunding(
            useOnboardingStore.getState(),
            deposit.chainId,
          ).deposit;
          if (current?.hash !== deposit.hash || current.status !== "pending")
            return;
          setDeposit(
            {
              ...current,
              hash: transactionReceipt.transactionHash,
              status: reason === "repriced" ? "pending" : "failed",
            },
            deposit.chainId,
          );
        },
      });
      return { hash: result.transactionHash, status: result.status };
    },
  });
  useEffect(() => {
    if (!receipt.data) return;
    const current = getChainFunding(
      useOnboardingStore.getState(),
      deposit.chainId,
    ).deposit;
    if (current?.hash !== receipt.data.hash || current.status !== "pending")
      return;
    setDeposit(
      {
        ...current,
        status: receipt.data.status === "success" ? "confirmed" : "failed",
      },
      deposit.chainId,
    );
    void queryClient.invalidateQueries({
      queryKey: ["onboarding", "funding-token"],
    });
  }, [receipt.data, deposit.chainId, setDeposit, queryClient]);
  return receipt.error && deposit.status === "pending";
}
