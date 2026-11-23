import { useQuery } from "@tanstack/react-query";
import { erc20Abi } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import {
  FUNDING_CHAIN_ID,
  FUNDING_TOKEN_ADDRESS,
} from "../../../config/funding";

export function useFundingBalance() {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: FUNDING_CHAIN_ID });
  return useQuery({
    queryKey: [
      "onboarding",
      "funding-token",
      FUNDING_CHAIN_ID,
      FUNDING_TOKEN_ADDRESS,
      address,
    ],
    enabled: !!publicClient && !!address,
    staleTime: 20_000,
    retry: 1,
    queryFn: async () => {
      if (!publicClient || !address) return { balance: undefined };
      const balance = await publicClient.readContract({
        address: FUNDING_TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address],
      });
      return { balance };
    },
  });
}
