import { useQuery } from "@tanstack/react-query";
import { analyticsScope } from "@/config/analytics";
import type { WorkspaceContext } from "@/types/workspace";
import type { LoginSession } from "../login";
import type { AnalyticsRange } from "../../../vendor/partner-analytics/lib/analytics-range";
import { AnalyticsRequestError, checkAnalyticsAccess, fetchAnalytics } from "./api";

export const analyticsQueryKey = ["portal-analytics"] as const;

export function useAnalytics(session: LoginSession, range: AnalyticsRange, workspace?: WorkspaceContext) {
  const partnerId = workspace === undefined ? analyticsScope.partnerId : workspace.partnerId;
  const chainIds = workspace === undefined ? [analyticsScope.chainId] : workspace.chainIds.map(String);
  const walletKey = [...analyticsQueryKey, session.address.toLowerCase(), session.nonce, workspace?.key ?? "preview", workspace?.revision ?? "preview", partnerId, chainIds];
  const retry = (attempt: number, error: Error) =>
    !(error instanceof AnalyticsRequestError && error.status < 500) && attempt < 1;
  const access = useQuery({
    queryKey: [...walletKey, "access"],
    queryFn: ({ signal }) => checkAnalyticsAccess(session, signal, workspace),
    staleTime: 0,
    gcTime: 0,
    retry,
  });
  const stats = useQuery({
    queryKey: [...walletKey, "stats", range],
    queryFn: ({ signal }) => fetchAnalytics(session, range, signal, workspace),
    enabled: access.isSuccess,
    gcTime: 0,
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry,
  });
  return { access, stats };
}
