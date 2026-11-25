/** Local activation placeholder until the partner API is connected. */
export type PartnerActivationStatus = "pending" | "active" | "unconfirmed";

export async function mockActivationStatus(partnerId: string): Promise<PartnerActivationStatus> {
  if (!partnerId.trim()) throw new Error("Status unavailable");
  return "unconfirmed";
}

/** Registry status is shared by setup completion and saved requests. */
export async function fetchEnabledChainIds(partnerId: string, signal?: AbortSignal): Promise<number[]> {
  return (await fetchPartnerRegistryStatus(partnerId, signal)).enabledChainIds;
}

export async function fetchPartnerRegistryStatus(partnerId: string, signal?: AbortSignal, checkAvailability = false): Promise<{ exists: boolean; enabledChainIds: number[] }> {
  const response = await fetch(`/api/partner-registry-status?${new URLSearchParams({ partner: partnerId, ...(checkAvailability ? { availability: "1" } : {}) })}`, { signal, cache: "no-store" });
  if (!response.ok) throw new Error(checkAvailability ? "Partner ID availability unavailable" : "Registry status unavailable");
  const data: unknown = await response.json();
  if (!data || typeof data !== "object" || !("partnerId" in data) || data.partnerId !== partnerId ||
      !("exists" in data) || typeof data.exists !== "boolean" || !("enabledChainIds" in data) || !Array.isArray(data.enabledChainIds) ||
      !data.enabledChainIds.every(id => Number.isSafeInteger(id) && id > 0)) throw new Error("Invalid registry status");
  return { exists: data.exists, enabledChainIds: data.enabledChainIds as number[] };
}
