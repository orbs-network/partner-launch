import { useRegistryStatus } from "./useRegistryStatus";
import type { PendingRequest } from "./request-record";

/** Review status from the database, plus verified Perps trading availability. */
export function useSetupStatus(request: PendingRequest | undefined, status: "pending" | "approved") {
  const registry = useRegistryStatus(request?.kind === "perps" ? request : undefined);
  const registryStatus = status === "approved" ? "approved" as const
    : request?.kind === "spot"
      ? "pending" as const
      : !registry.eligible ? "pending" as const : registry.isError ? "error" as const : registry.ready ? "ready" as const : registry.data ? "pending" as const : "checking" as const;
  const live = request?.kind === "perps" && registry.ready && !registry.isError;
  return { registryStatus, live, tradingEnabled: request?.kind === "perps" && live };
}
