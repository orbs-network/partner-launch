import { useEffect, useState } from "react";
import type { PendingRequest } from "./request-record";
import { approveLocally, MOCK_APPROVALS_KEY, readMockApprovals, sameRequest, type MockApproval } from "./mock-approvals";

export function useMockApprovals(requests: PendingRequest[]) {
  const [approvals, setApprovals] = useState<MockApproval[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    function load() {
      try { setApprovals(readMockApprovals(localStorage.getItem(MOCK_APPROVALS_KEY))); setError(null); }
      catch { setError("Approvals could not be loaded. Check browser storage and try again."); }
    }
    function onStorage(event: StorageEvent) { if (event.key === MOCK_APPROVALS_KEY || event.key === null) load(); }
    load();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const pending = requests.filter(request => request.status === "pending" && !approvals.some(item => sameRequest(item.request, request)));
  function approve(request: PendingRequest): boolean {
    try { setApprovals(approveLocally(request)); setError(null); return true; }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Couldn’t save the approval. Check browser storage and try again."); return false; }
  }
  return { approvals, pending, error, approve };
}
