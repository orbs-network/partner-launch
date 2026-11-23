import type { PartnerOperationalConfig } from "@perpetual-hub/partner-config";
import { findPartnerById } from "../vendor/partner-analytics/lib/auth";
import { analyticsPartner, analyticsScope } from "../src/config/analytics";

export class AnalyticsScopeError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

/** Resolve only registered scope; local workspace records never grant access. */
export function resolveAnalyticsScope(value: unknown): { partner: PartnerOperationalConfig; chainId: string } {
  if (value === undefined) return { partner: analyticsPartner, chainId: analyticsScope.chainId };
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AnalyticsScopeError("Choose a valid workspace for analytics.", 400);
  }
  const { partnerId, chainIds } = value as Record<string, unknown>;
  if (typeof partnerId !== "string" || !/^[a-z0-9-]{1,64}$/.test(partnerId) ||
      !Array.isArray(chainIds) || !chainIds.length ||
      chainIds.some((id) => typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0)) {
    throw new AnalyticsScopeError("Choose a valid workspace for analytics.", 400);
  }
  if (chainIds.length !== 1) {
    throw new AnalyticsScopeError("Analytics is not available for a workspace with multiple networks. Select a workspace with one registered network.", 422);
  }
  const registered = findPartnerById(partnerId);
  if (!registered || registered.id !== partnerId) {
    throw new AnalyticsScopeError("Analytics is not connected for this workspace yet. Team activation is required before live data is available.", 404);
  }
  const chain = registered.chains.find((item) => item.chainId === chainIds[0]);
  if (!chain) {
    throw new AnalyticsScopeError("Analytics is not connected for this workspace’s network.", 404);
  }
  // The grant check and BI service must both see the exact selected lane.
  return { partner: { ...registered, chains: [chain] }, chainId: String(chain.chainId) };
}
