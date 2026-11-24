import { useRegistryStatus } from "./useRegistryStatus";
import { useSpotConfigStatus } from "./useSpotConfigStatus";
import type { PendingRequest } from "./request-record";

/** Review status from the database, plus whether the setup is live (Perps trading lane / Spot configuration). */
export function useSetupStatus(request: PendingRequest | undefined, status: "pending" | "approved") {
  const registry = useRegistryStatus(request?.kind === "perps" ? request : undefined);
  const spotConfig = useSpotConfigStatus(request?.kind === "spot" ? request : undefined);
  const registryStatus = status === "approved" ? "approved" as const
    : request?.kind === "spot"
      ? !spotConfig.eligible ? "pending" as const : spotConfig.isError ? "error" as const : spotConfig.ready ? "ready" as const : spotConfig.data ? "pending" as const : "checking" as const
      : !registry.eligible ? "pending" as const : registry.isError ? "error" as const : registry.ready ? "ready" as const : registry.data ? "pending" as const : "checking" as const;
  const live = request?.kind === "perps" ? registry.ready && !registry.isError : !!spotConfig.ready && !spotConfig.isError;
  return { registryStatus, live, tradingEnabled: request?.kind === "perps" && live };
}
