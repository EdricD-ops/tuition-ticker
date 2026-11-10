import { parseErApi, parseFrankfurter, type RateTable } from '../core';

/** Primary source: free, no key, daily, covers MOP. Fallback: Frankfurter (ECB, no MOP). */
export const RATE_SOURCES = [
  {
    url: (base: string) => `https://open.er-api.com/v6/latest/${encodeURIComponent(base)}`,
    parse: parseErApi,
  },
  {
    url: (base: string) => `https://api.frankfurter.dev/v1/latest?base=${encodeURIComponent(base)}`,
    parse: parseFrankfurter,
  },
] as const;

const TIMEOUT_MS = 8000;

type FetchLike = (url: string, init?: { signal?: AbortSignal }) => Promise<{
  ok: boolean;
  json: () => Promise<unknown>;
}>;

/**
 * Fetches today's reference rates for `base`, trying each source in turn. Returns null when
 * every source fails (offline, unsupported currency, bad answer).
 */
export async function fetchRateTable(
  base: string,
  fetchImpl: FetchLike = (url, init) => fetch(url, init),
  now: () => number = Date.now,
): Promise<RateTable | null> {
  for (const source of RATE_SOURCES) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetchImpl(source.url(base), { signal: controller.signal });
      if (!res.ok) continue;
      const table = source.parse(await res.json(), base, now());
      if (table) return table;
    } catch {
      // Network error, timeout or invalid JSON: try the next source.
    } finally {
      clearTimeout(timer);
    }
  }
  return null;
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const cacheKey = (base: string) => `tuition-ticker:rates:${base.toUpperCase()}`;

function defaultStorage(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

const isTable = (v: unknown, base: string): v is RateTable => {
  if (typeof v !== 'object' || v === null) return false;
  const t = v as RateTable;
  return (
    t.base === base.toUpperCase() &&
    typeof t.asOf === 'string' &&
    Number.isFinite(t.fetchedAt) &&
    typeof t.rates === 'object' &&
    t.rates !== null
  );
};

/** The last rate table saved for `base`, or null. */
export function readCachedRates(base: string, storage = defaultStorage()): RateTable | null {
  try {
    const raw = storage?.getItem(cacheKey(base));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isTable(parsed, base) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeCachedRates(table: RateTable, storage = defaultStorage()): void {
  try {
    storage?.setItem(cacheKey(table.base), JSON.stringify(table));
  } catch {
    // Storage full or blocked: rates simply aren't remembered.
  }
}
