const REGISTRY_URL = "https://perps-api.orbs.network/api/v1/partner-registry";
const MAX_REGISTRY_BYTES = 1024 * 1024;

export async function registryLanes(partnerId?: string, chainId?: number): Promise<unknown[]> {
  try {
    const url = new URL(REGISTRY_URL);
    if (partnerId) url.searchParams.set("partner", partnerId);
    if (chainId !== undefined) url.searchParams.set("chainId", String(chainId));
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok || !response.body) throw new Error("Registry unavailable");
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_REGISTRY_BYTES) {
        await reader.cancel();
        throw new Error("Registry too large");
      }
      chunks.push(value);
    }
    const payload: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("Invalid registry");
    const registry = payload as Record<string, unknown>;
    if (registry.schemaVersion !== 1 || !Array.isArray(registry.lanes)) throw new Error("Invalid registry");
    return registry.lanes;
  } catch {
    throw new Error("Partner registry is temporarily unavailable.");
  }
}

