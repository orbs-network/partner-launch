import { partnerAdapters, SOURCES } from "./catalog";

const PAGE_SIZE = 100;
const MAX_PAGES = 100;
export class SpotAnalyticsError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}
export interface SpotOrder { hash: string; chainId: number; timestamp: string; status: string; displayStatus?: string; orderValueUsd: number | null }
export interface SpotAnalyticsData { orders: SpotOrder[] }
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);

function parseOrder(raw: unknown): SpotOrder | null {
  if (!record(raw) || typeof raw.hash !== "string" || !record(raw.metadata) || typeof raw.metadata.status !== "string" ||
      !record(raw.order) || !record(raw.order.witness)) throw new SpotAnalyticsError("Spot analytics returned an invalid order.", 502);
  const chainId = Number(raw.order.witness.chainId ?? raw.order.witness.chainid);
  if (!Number.isSafeInteger(chainId) || chainId <= 0) throw new SpotAnalyticsError("Spot analytics returned an invalid network.", 502);
  if (typeof raw.timestamp !== "string" || !Number.isFinite(Date.parse(raw.timestamp))) return null;
  const amount = raw.totalUSDAmount;
  const parsed = typeof amount === "string" && /^\d+(?:\.\d+)?$/.test(amount) ? Number(amount) : NaN;
  return { hash: raw.hash, chainId, timestamp: raw.timestamp, status: raw.metadata.status, ...(typeof raw.metadata.displayOnlyStatus === "string" ? { displayStatus: raw.metadata.displayOnlyStatus } : {}), orderValueUsd: Number.isFinite(parsed) ? parsed : null };
}

/** Load complete scoped history from both services, preferring v2 for duplicate orders. */
export async function fetchSpotAnalytics(partnerId: string, days: number, signal: AbortSignal): Promise<SpotAnalyticsData> {
  if (!/^[\p{L}\p{M}\p{N}_-]{1,80}$/u.test(partnerId) || ![7, 30, 90].includes(days)) throw new SpotAnalyticsError("Choose a valid partner and time range.", 400);
  const adapters = await partnerAdapters(partnerId, signal);
  if (!adapters.size) throw new SpotAnalyticsError("This partner is not available in Spot order history yet.", 404);
  const addresses = [...new Set([...adapters.keys()].map(key => key.split(":")[1]))];
  const start = Date.now() - days * 86_400_000;
  const fetchSource = async (source: string) => {
    const result: SpotOrder[] = [];
    // The original service accepts one adapter at a time. Limit upstream concurrency.
    for (const adapter of addresses) {
      let previous = Infinity;
      let ordered = true;
      for (let page = 1; page <= MAX_PAGES; page++) {
        const url = new URL(`${source}/orders`);
        url.search = new URLSearchParams({ exchange: adapter, view: "list", limit: String(PAGE_SIZE), page: String(page) }).toString();
        const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
        if (!response.ok) throw new SpotAnalyticsError("Spot order history is temporarily unavailable.", response.status);
        const value: unknown = await response.json();
        if (!record(value) || !Array.isArray(value.orders) || value.orders.length > PAGE_SIZE) throw new SpotAnalyticsError("Spot analytics returned an invalid response.", 502);
        for (const raw of value.orders) {
          if (!record(raw) || typeof raw.exchangeAdapter !== "string" || raw.exchangeAdapter.toLowerCase() !== adapter) throw new SpotAnalyticsError("Spot analytics returned orders outside this partner scope.", 502);
          const order = parseOrder(raw);
          if (!order) { ordered = false; continue; }
          const time = Date.parse(order.timestamp);
          if (time > previous) ordered = false;
          previous = time;
          if (time >= start && time <= Date.now() && adapters.has(`${order.chainId}:${adapter}`)) result.push(order);
        }
        if (value.orders.length < PAGE_SIZE || (ordered && previous < start)) break;
        if (page === MAX_PAGES) throw new SpotAnalyticsError("This time range has too many orders to load. Choose a shorter range.", 422);
      }
    }
    return result;
  };
  const pages = await Promise.all(SOURCES.map(fetchSource));
  const unique = new Map<string, SpotOrder>();
  for (const order of pages.flat()) {
    const key = `${order.chainId}:${order.hash.toLowerCase()}`;
    if (!unique.has(key)) unique.set(key, order);
  }
  return { orders: [...unique.values()].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)) };
}
