import { useEffect, useRef } from "react";
import { skipToken, useQuery } from "@tanstack/react-query";
import { fetchEnabledChainIds, mockActivationStatus, type PartnerActivationStatus } from "../registry-status";
import type { SavedSetupRequestReceipt } from "../setup-request-receipt";
import { useMountedRef } from "./useMountedRef";

interface RefreshAttempt {
  partnerId: string;
}

/** Callers supply only a receipt verified against its saved setup. */
export function useSetupRequestStatus(receipt?: SavedSetupRequestReceipt, chainIds: number[] = []) {
  const partnerId = receipt?.partnerId ?? null;
  const mounted = useMountedRef();
  const attemptRef = useRef<RefreshAttempt | null>(null);
  const status = useQuery<number[] | PartnerActivationStatus, Error, PartnerActivationStatus>({
    queryKey: receipt?.notification === "telegram" ? ["pending-request-registry", partnerId] : ["partner-activation-local-mock", partnerId],
    queryFn: receipt ? receipt.notification === "telegram" ? ({ signal }) => fetchEnabledChainIds(receipt.partnerId, signal) : () => mockActivationStatus(receipt.partnerId) : skipToken,
    select: data => Array.isArray(data) ? chainIds.length > 0 && chainIds.every(id => data.includes(id)) ? "active" : "unconfirmed" : data,
    refetchInterval: receipt?.notification === "telegram" ? 60_000 : false,
    retry: 1,
    staleTime: 0,
  });
  useEffect(() => () => {
    const attempt = attemptRef.current;
    if (!attempt || attempt.partnerId !== partnerId) return;
    attemptRef.current = null;
  }, [partnerId]);

  function refresh() {
    if (!receipt || status.isFetching || !mounted.current) return;
    const previous = attemptRef.current;
    if (previous?.partnerId === receipt.partnerId) return;
    const attempt: RefreshAttempt = { partnerId: receipt.partnerId };
    attemptRef.current = attempt;
    function finish() {
      if (!mounted.current || attemptRef.current !== attempt) return;
      attemptRef.current = null;
    }
    // Feedback follows the real query; never prolong loading after it settles.
    void status.refetch().then(finish, finish);
  }

  const isRefreshing = status.isFetching;
  return { status, refresh, isRefreshing };
}
