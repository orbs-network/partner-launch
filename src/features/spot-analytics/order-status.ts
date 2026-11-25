import type { SpotOrder } from "./api";

export type SpotOrderStatus = "open" | "completed" | "partial" | "cancelled" | "expired" | "failed" | "other";

/** Match the outcome rules used by Orbs Explorer; an unsuccessful attempt can still be open. */
export function spotOrderStatus(order: Pick<SpotOrder, "status" | "displayStatus">): SpotOrderStatus {
  const raw = order.status.toLowerCase();
  const display = (order.displayStatus ?? "").toUpperCase();
  if (raw === "cancelled" || raw === "canceled" || display === "CANCELLED" || display === "CANCELED") return "cancelled";
  if (raw === "expired" || display === "EXPIRED") return "expired";
  if (raw === "completed" || display === "SUCCEEDED") return "completed";
  if (raw === "partially_completed" || display === "PARTIALLY SUCCEEDED") return "partial";
  if (raw === "pending" || raw === "eligible" || display === "PENDING" || display === "PENDING-PRICE-CHECK") return "open";
  if (raw === "failed" || raw === "error" || display === "FAILED" || display === "ERROR") return "failed";
  return "other";
}

export function countSpotStatuses(orders: SpotOrder[]): Record<SpotOrderStatus, number> {
  const counts: Record<SpotOrderStatus, number> = { open: 0, completed: 0, partial: 0, cancelled: 0, expired: 0, failed: 0, other: 0 };
  for (const order of orders) counts[spotOrderStatus(order)]++;
  return counts;
}
