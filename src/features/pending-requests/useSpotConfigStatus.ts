import { useQuery } from "@tanstack/react-query";
import { validateDexName } from "../onboarding/dex-identity";
import { generateSpotAppId } from "../onboarding/spot/app-id";
import type { SpotRequest } from "./request-record";

export function useSpotConfigStatus(request: SpotRequest | undefined) {
  const eligible = !!request && request.notification === "telegram" && !validateDexName(request.appName);
  const query = useQuery({
    queryKey: ["spot-config-status"],
    enabled: eligible,
    queryFn: async ({ signal }) => {
      const response = await fetch("/api/spot-config-status", { signal, cache: "no-store" });
      if (!response.ok) throw new Error("Spot configuration unavailable");
      const data: unknown = await response.json();
      if (!data || typeof data !== "object" || !("keys" in data) || !Array.isArray(data.keys) ||
        !data.keys.every(key => typeof key === "string" && key.length <= 160)) throw new Error("Invalid Spot configuration");
      return data.keys as string[];
    },
    refetchInterval: 60_000,
    retry: 1,
    staleTime: 0,
  });
  return { ...query, eligible, ready: eligible && !!query.data?.includes(request!.partnerId ?? generateSpotAppId(request!.appName)) };
}
