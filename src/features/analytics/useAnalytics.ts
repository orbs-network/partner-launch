import { useQuery } from "@tanstack/react-query";
import { analyticsScope } from "@/config/analytics";
import type { WorkspaceContext } from "@/types/workspace";
import type { AnalyticsIdentity } from "./api";
import type { AnalyticsRange } from "../../../vendor/partner-analytics/lib/analytics-range";
import { AnalyticsRequestError, checkAnalyticsAccess, fetchAnalytics } from "./api";

export const analyticsQueryKey = ["portal-analytics"] as const;

export function useAnalytics(identity: AnalyticsIdentity, range: AnalyticsRange, workspace?: WorkspaceContext) {
  const partnerId = workspace === undefined ? analyticsScope.partnerId : workspace.partnerId;
  const chainIds = workspace === undefined ? [analyticsScope.chainId] : workspace.chainIds.map(String);
  const walletKey = [...analyticsQueryKey, identity.address.toLowerCase(), "nonce" in identity ? identity.nonce : "connected", workspace?.key ?? "preview", workspace?.revision ?? "preview", partnerId, chainIds];
  const retry = (attempt: number, error: Error) =>
    !(error instanceof AnalyticsRequestError && error.status < 500) && attempt < 1;
  const access = useQuery({
    queryKey: [...walletKey, "access"],
    queryFn: ({ signal }) => checkAnalyticsAccess(identity, signal, workspace),
    staleTime: 0,
    gcTime: 0,
    retry,
  });
  const stats = useQuery({
    queryKey: [...walletKey, "stats", range],
    queryFn: ({ signal }) => fetchAnalytics(identity, range, signal, workspace),
    enabled: access.isSuccess,
    gcTime: 0,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry,
  });
  return { access, stats };
}
