import { useEffect } from "react";
import { toast } from "sonner";
import { MOCK_APPROVALS_KEY, readMockApprovals, sameRequest } from "./mock-approvals";
import { usePendingRequests } from "./store";

export function ApprovalNotifications() {
  const { requests } = usePendingRequests();
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== MOCK_APPROVALS_KEY || !event.newValue) return;
      try {
        const previous = readMockApprovals(event.oldValue);
        const current = readMockApprovals(event.newValue);
        for (const approval of current) {
          if (previous.some(item => sameRequest(item.request, approval.request)) ||
              !requests.some(request => request.status === "pending" && sameRequest(request, approval.request))) continue;
          toast.success(`${approval.request.appName} approved`, { duration: 5000 });
        }
      } catch {
        // The setup view reports unreadable storage separately.
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [requests]);
  return null;
}
