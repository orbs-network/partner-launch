import { partnerRegistry } from "@perpetual-hub/partner-config/partners";

// Preserve the Global preview only when there is no selected saved workspace.
export const analyticsPartner = partnerRegistry.global;
export const analyticsChain = analyticsPartner.chains[0];
export const analyticsScope = {
  partnerId: analyticsPartner.id,
  chainId: String(analyticsChain.chainId),
} as const;
