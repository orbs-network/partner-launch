import { skipToken, useQuery } from "@tanstack/react-query";
import type { PerpsRequest } from "./request-record";
import { fetchEnabledChainIds } from "../onboarding/registry-status";

export function useRegistryStatus(request: PerpsRequest | undefined) {
  const partnerId = request?.notification === "telegram" ? request.partnerId : undefined;
  const query = useQuery({
    queryKey: ["pending-request-registry", partnerId],
    queryFn: partnerId ? ({ signal }) => fetchEnabledChainIds(partnerId, signal) : skipToken,
    refetchInterval: 60_000,
    retry: 1,
    staleTime: 0,
  });
  const ready = !!request && !!query.data && request.chainIds.every(id => query.data.includes(id));
  return { ...query, ready, eligible: !!partnerId };
}
