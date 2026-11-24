import { skipToken, useQuery } from "@tanstack/react-query";
import { fetchCollateral } from "../collateral";

export function useChainCollateral(chainId: number | null) {
  return useQuery({
    queryKey: ["chain-collateral", chainId],
    queryFn: chainId ? ({ signal }) => fetchCollateral(chainId, signal) : skipToken,
    staleTime: 60_000,
    retry: 1,
  });
}
