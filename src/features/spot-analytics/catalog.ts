const CONFIG = "https://raw.githubusercontent.com/orbs-network/spot/master/config.json";
export const SOURCES = ["https://order-sink-v2.orbs.network", "https://order-sink.orbs.network"] as const;
const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
const address = (value: unknown): value is string => typeof value === "string" && /^0x[0-9a-f]{40}$/i.test(value) && !/^0x0{40}$/i.test(value);
// The same aliases used by Orbs Explorer's partner catalog.
const aliases: Record<string, string> = { quick: "quickswap", spooky: "spookyswap", pancake: "pancakeswap", dragon: "dragonswap", spark: "sparkdex" };
const canonical = (value: string) => {
  const key = value.trim().replace(/-old-\d+$/i, "").toLowerCase();
  return aliases[key] ?? key;
};

async function getJson(url: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error("Spot partner catalog is unavailable.");
  return response.json();
}

/** Map chain and adapter to an unambiguous app; current configuration takes precedence. */
export async function partnerAdapters(partnerId: string, signal: AbortSignal): Promise<Map<string, string>> {
  const [config, ...statuses] = await Promise.all([getJson(CONFIG, signal), ...SOURCES.map(source => getJson(`${source}/status`, signal))]);
  if (!isRecord(config) || !isRecord(config["*"])) throw new Error("Spot partner catalog is unavailable.");
  const entries = new Map<string, string | null>();
  const shared = isRecord(config["*"].dex) ? config["*"].dex : {};
  for (const [chainId, chain] of Object.entries(config)) {
    if (!/^[1-9]\d*$/.test(chainId) || !isRecord(chain)) continue;
    const dexes = { ...shared, ...(isRecord(chain.dex) ? chain.dex : {}) };
    for (const [name, dex] of Object.entries(dexes)) {
      if (isRecord(dex) && address(dex.adapter)) {
        const key = `${chainId}:${dex.adapter.toLowerCase()}`;
        const id = canonical(name);
        entries.set(key, entries.has(key) && entries.get(key) !== id ? null : id);
      }
    }
  }
  const historical = new Map<string, Set<string>>();
  for (const status of statuses) {
    if (!isRecord(status) || !Array.isArray(status.chains)) throw new Error("Spot partner catalog is unavailable.");
    for (const chain of status.chains) {
      if (!isRecord(chain) || !Number.isSafeInteger(chain.chainId) || Number(chain.chainId) <= 0 || !Array.isArray(chain.exchanges)) throw new Error("Spot partner catalog is unavailable.");
      for (const exchange of chain.exchanges) {
        if (!isRecord(exchange) || typeof exchange.name !== "string" || !address(exchange.address)) continue;
        const key = `${chain.chainId}:${exchange.address.toLowerCase()}`;
        if (!entries.has(key)) {
          const ids = historical.get(key) ?? new Set<string>();
          ids.add(canonical(exchange.name));
          historical.set(key, ids);
        }
      }
    }
  }
  for (const [key, ids] of historical) if (ids.size === 1) entries.set(key, [...ids][0]);
  const target = canonical(partnerId);
  return new Map([...entries].filter((entry): entry is [string, string] => entry[1] === target));
}
