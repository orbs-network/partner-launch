import type { LoginSession } from "../login";
import { analyticsScope } from "@/config/analytics";
import type { WorkspaceContext } from "@/types/workspace";
import type { AnalyticsRange } from "../../../vendor/partner-analytics/lib/analytics-range";
import type { PartnerAnalyticsStats } from "../../../vendor/partner-analytics/src/types";

export type AnalyticsIdentity = LoginSession | { address: string };

export class AnalyticsRequestError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

async function request<T>(path: string, body: object, signal: AbortSignal): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new AnalyticsRequestError(
    typeof payload?.error === "string" ? payload.error : "Analytics is temporarily unavailable. Please try again.",
    response.status,
  );
  if (!payload) throw new AnalyticsRequestError("Analytics returned an unreadable response. Please try again.", 502);
  return payload as T;
}

function identityBody(identity: AnalyticsIdentity) {
  return "signature" in identity ? { session: identity } : { address: identity.address };
}

function workspaceBody(workspace: WorkspaceContext | undefined) {
  return workspace === undefined ? {} : { workspace: { partnerId: workspace.partnerId, chainIds: [...workspace.chainIds] } };
}

export async function checkAnalyticsAccess(identity: AnalyticsIdentity, signal: AbortSignal, workspace?: WorkspaceContext) {
  const payload = await request<{ walletAddress: string; partner: { id: string } }>("/api/analytics-access", { ...identityBody(identity), ...workspaceBody(workspace) }, signal);
  const partnerId = workspace === undefined ? analyticsScope.partnerId : workspace.partnerId;
  if (payload.partner?.id !== partnerId || payload.walletAddress?.toLowerCase() !== identity.address.toLowerCase()) {
    throw new AnalyticsRequestError("The workspace access response could not be verified. Please try again.", 502);
  }
  return payload;
}

export async function fetchAnalytics(identity: AnalyticsIdentity, range: AnalyticsRange, signal: AbortSignal, workspace?: WorkspaceContext) {
  const payload = await request<PartnerAnalyticsStats>("/api/analytics-stats", { ...identityBody(identity), range, ...workspaceBody(workspace) }, signal);
  const partnerId = workspace === undefined ? analyticsScope.partnerId : workspace.partnerId;
  const chainIds = workspace === undefined ? [analyticsScope.chainId] : workspace.chainIds.map(String);
  if (chainIds.length !== 1 || payload.scope?.partnerId !== partnerId ||
      !Array.isArray(payload.scope.chainIds) || payload.scope.chainIds.length !== 1 || payload.scope.chainIds[0] !== chainIds[0]) {
    throw new AnalyticsRequestError("Analytics returned data for another workspace. Please try again.", 502);
  }
  return payload;
}
