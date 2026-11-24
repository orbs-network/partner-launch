import { readRequest, readRequests, type PendingRequest } from "./request-record";
import { PENDING_REQUESTS_KEY } from "./store";

export const MOCK_APPROVALS_KEY = "partner-portal-mock-approvals-v1";

export interface MockApproval {
  request: PendingRequest;
  approvedAt: string;
}

export function readMockApprovals(raw: string | null): MockApproval[] {
  if (raw === null) return [];
  const value: unknown = JSON.parse(raw);
  if (!value || typeof value !== "object" || !("version" in value) || value.version !== 1 ||
      !("approvals" in value) || !Array.isArray(value.approvals)) throw new Error("Saved approvals could not be read.");
  return value.approvals.map((item: unknown) => {
    if (!item || typeof item !== "object" || !("request" in item) || !("approvedAt" in item) ||
        typeof item.approvedAt !== "string" || !Number.isFinite(Date.parse(item.approvedAt))) throw new Error("Saved approvals could not be read.");
    const request = readRequest(item.request);
    if (!request || request.status !== "pending") throw new Error("Saved approvals could not be read.");
    return { request, approvedAt: item.approvedAt };
  });
}

export function sameRequest(left: PendingRequest, right: PendingRequest): boolean {
  const first = readRequest(left);
  const second = readRequest(right);
  return !!first && !!second && JSON.stringify(first) === JSON.stringify(second);
}

/** A separate display-only mock; it never changes or activates the real request. */
export function approveLocally(request: PendingRequest): MockApproval[] {
  const current = readRequests(localStorage.getItem(PENDING_REQUESTS_KEY)).find(item => item.id === request.id);
  if (!current || current.status !== "pending" || !sameRequest(current, request)) throw new Error("This request changed. Refresh the page and review it again.");
  const approvals = readMockApprovals(localStorage.getItem(MOCK_APPROVALS_KEY));
  if (!approvals.some(item => sameRequest(item.request, current))) {
    approvals.unshift({ request: current, approvedAt: new Date().toISOString() });
    localStorage.setItem(MOCK_APPROVALS_KEY, JSON.stringify({ version: 1, approvals }));
  }
  return approvals;
}
