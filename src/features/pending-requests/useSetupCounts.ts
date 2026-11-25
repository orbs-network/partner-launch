import { useWalletRequests } from "./wallet-requests-context";

export function useSetupCounts() {
  const { requests, error } = useWalletRequests();
  const statusOf = (request: typeof requests[number]) => (request.status === "ready" || request.status === "approved") ? "approved" : "pending";
  const pendingCount = requests.filter(request => statusOf(request) === "pending").length;
  return { requests, error, statusOf, pendingCount, approvedCount: requests.length - pendingCount };
}
