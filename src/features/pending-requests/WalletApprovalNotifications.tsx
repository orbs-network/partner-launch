import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useWalletRequests } from "./wallet-requests-context";

const DISMISSED_PREFIX = "partner-portal-approval-dismissed-v1:";

/** Approvals remain visible until dismissed, including approvals made while the user was away. */
export function WalletApprovalNotifications() {
  const { requests, address, error, loading } = useWalletRequests();
  const shown = useRef(new Set<string>());
  const dismissedInMemory = useRef(new Set<string>());
  useEffect(() => {
    if (!address || error || loading) return;
    const wallet = address.toLowerCase();
    for (const request of requests) {
      if (request.status !== "approved") continue;
      const key = `${DISMISSED_PREFIX}${wallet}:${request.id}${request.approvalRevision ? `:${request.approvalRevision}` : ""}`;
      if (shown.current.has(key) || dismissedInMemory.current.has(key)) continue;
      try { if (localStorage.getItem(key) === "1") continue; } catch { /* In-memory dismissal remains available. */ }
      shown.current.add(key);
      toast.success(`${request.appName} approved!`, {
        id: key,
        description: "Your setup has been approved by the team.",
        duration: Infinity,
        closeButton: true,
        dismissible: true,
        onDismiss: () => {
          dismissedInMemory.current.add(key);
          try { localStorage.setItem(key, "1"); } catch { /* Keep the dismissal for this page session. */ }
        },
      });
    }
  }, [requests, address, error, loading]);
  return null;
}
