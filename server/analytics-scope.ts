import type { PartnerOperationalConfig } from "../vendor/partner-analytics/lib/partner-scope";
import { analyticsScope } from "../src/config/analytics.js";

import { registryLanes } from "./partner-registry.js";

export class AnalyticsScopeError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

/** Registry membership selects a lane; a separate backend grant authorizes the wallet. */
export async function resolveAnalyticsScope(value: unknown): Promise<{ partner: PartnerOperationalConfig; chainId: string }> {
  const scope = value === undefined
    ? { partnerId: analyticsScope.partnerId, chainIds: [Number(analyticsScope.chainId)] }
    : value;
  if (!scope || typeof scope !== "object" || Array.isArray(scope)) {
    throw new AnalyticsScopeError("Choose a valid workspace for analytics.", 400);
  }
  const { partnerId, chainIds } = scope as Record<string, unknown>;
  if (typeof partnerId !== "string" || (partnerId !== "QuickSwap1" && !/^[a-z0-9-]{1,64}$/.test(partnerId)) ||
      !Array.isArray(chainIds) || !chainIds.length ||
      chainIds.some((id) => typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0)) {
    throw new AnalyticsScopeError("Choose a valid workspace for analytics.", 400);
  }
  if (chainIds.length !== 1) {
    throw new AnalyticsScopeError("Analytics is not available for a workspace with multiple networks. Select a workspace with one registered network.", 422);
  }
  const chainId = String(chainIds[0]);
  let lanes: unknown[];
  try { lanes = await registryLanes(partnerId); }
  catch { throw new AnalyticsScopeError("Partner registry is temporarily unavailable. Try again.", 502); }
  const matches = lanes.filter((lane) => {
    if (!lane || typeof lane !== "object" || Array.isArray(lane)) return false;
    const item = lane as Record<string, unknown>;
    return item.partnerId === partnerId && item.chainId === chainId && item.status === "enabled";
  });
  if (matches.length !== 1) {
    throw new AnalyticsScopeError("Analytics is not connected for this workspace’s network. Team activation is required before live data is available.", 404);
  }
  return { partner: { id: partnerId, chains: [{ chainId: chainIds[0] }] }, chainId };
}
