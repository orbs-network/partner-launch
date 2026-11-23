const STATS_CACHE_TTL_MS = 30_000;
const MAX_STATS_CACHE_ENTRIES = 256;

type StatsCacheEntry<T> = {
  expiresAt: number;
  value: Promise<T>;
};

const statsCache = new Map<string, StatsCacheEntry<unknown>>();

function pruneStatsCache(now: number) {
  for (const [key, entry] of statsCache) {
    if (entry.expiresAt <= now) statsCache.delete(key);
  }
  while (statsCache.size >= MAX_STATS_CACHE_ENTRIES) {
    const oldestKey = statsCache.keys().next().value as string | undefined;
    if (!oldestKey) break;
    statsCache.delete(oldestKey);
  }
}

export function statsCacheKey(
  partnerId: string,
  chainIds: readonly string[],
  range: string,
) {
  return `${partnerId}:${[...chainIds].sort().join(",")}:${range}`;
}

export async function withStatsCache<T>(
  key: string,
  load: () => Promise<T>,
  now = Date.now(),
) {
  const cached = statsCache.get(key) as StatsCacheEntry<T> | undefined;
  if (cached && cached.expiresAt > now) return cached.value;

  pruneStatsCache(now);
  const value = load();
  statsCache.set(key, {
    expiresAt: now + STATS_CACHE_TTL_MS,
    value,
  });
  try {
    return await value;
  } catch (error) {
    if (statsCache.get(key)?.value === value) statsCache.delete(key);
    throw error;
  }
}

export function clearStatsCache() {
  statsCache.clear();
}
