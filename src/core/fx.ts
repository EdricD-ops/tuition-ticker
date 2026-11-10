import type { PlainDate } from './types';

/**
 * Exchange rates for one base currency, as returned by a reference-rate API. Rates are
 * daily reference figures, not live trading quotes.
 */
export interface RateTable {
  /** ISO 4217 code every rate is quoted against. */
  base: string;
  /** Units of each quote currency per 1 unit of `base`. */
  rates: Record<string, number>;
  /** UTC date the provider published these rates. */
  asOf: PlainDate;
  /** Which provider answered. */
  provider: 'er-api' | 'frankfurter';
  /** When this browser fetched the table, epoch ms. */
  fetchedAt: number;
}

/** How a conversion rate was obtained, for the "rates updated …" note. */
export type RateSource =
  /** The user typed a fixed rate in settings. */
  | 'fixed'
  /** A rate table fetched recently. */
  | 'live'
  /** A rate table from an earlier visit, used because the latest fetch failed. */
  | 'cached';

export interface Conversion {
  from: string;
  to: string;
  /** Units of `to` per 1 unit of `from`. */
  rate: number;
  source: RateSource;
  /** Publication date of the rate; null for fixed rates. */
  asOf: PlainDate | null;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isRate = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
const upper = (s: string) => s.trim().toUpperCase();

function cleanRates(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!isObject(raw)) return out;
  for (const [code, value] of Object.entries(raw)) {
    if (/^[A-Z]{3}$/.test(code) && isRate(value)) out[code] = value;
  }
  return out;
}

function utcDate(ms: number): PlainDate {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Parses an `open.er-api.com/v6/latest/{BASE}` response. Null if it is not a success. */
export function parseErApi(json: unknown, base: string, fetchedAt: number): RateTable | null {
  if (!isObject(json) || json.result !== 'success') return null;
  if (typeof json.base_code !== 'string' || upper(json.base_code) !== upper(base)) return null;
  const updated = json.time_last_update_unix;
  if (typeof updated !== 'number' || !Number.isFinite(updated)) return null;
  const rates = cleanRates(json.rates);
  if (Object.keys(rates).length === 0) return null;
  return { base: upper(base), rates, asOf: utcDate(updated * 1000), provider: 'er-api', fetchedAt };
}

/** Parses an `api.frankfurter.dev/v1/latest?base={BASE}` response. Null if malformed. */
export function parseFrankfurter(json: unknown, base: string, fetchedAt: number): RateTable | null {
  if (!isObject(json) || typeof json.base !== 'string' || upper(json.base) !== upper(base)) return null;
  if (typeof json.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(json.date)) return null;
  const rates = cleanRates(json.rates);
  if (Object.keys(rates).length === 0) return null;
  // Frankfurter leaves the base out of its own table.
  rates[upper(base)] = 1;
  return { base: upper(base), rates, asOf: json.date, provider: 'frankfurter', fetchedAt };
}

/** A table is fresh for this long; older ones are refetched (they still work offline). */
export const RATE_TTL_MS = 6 * 60 * 60 * 1000;

export function isFresh(table: RateTable, now: number): boolean {
  return now - table.fetchedAt < RATE_TTL_MS && table.fetchedAt <= now;
}

/**
 * Picks the rate to convert `from` into `to`: a positive fixed rate wins, then the rate
 * table. Returns null when conversion is off or no rate is known.
 */
export function resolveConversion({
  from,
  to,
  fixedRate,
  table,
  tableIsCurrent,
}: {
  from: string;
  to: string | null;
  fixedRate: number | null;
  table: RateTable | null;
  /** False when the table is a leftover from an earlier visit and refreshing it failed. */
  tableIsCurrent: boolean;
}): Conversion | null {
  if (!to) return null;
  const f = upper(from);
  const q = upper(to);
  if (f === q) return null;
  if (fixedRate !== null && isRate(fixedRate)) {
    return { from: f, to: q, rate: fixedRate, source: 'fixed', asOf: null };
  }
  if (!table || table.base !== f) return null;
  const rate = table.rates[q];
  if (!isRate(rate)) return null;
  return { from: f, to: q, rate, source: tableIsCurrent ? 'live' : 'cached', asOf: table.asOf };
}

export function convert(amount: number, conversion: Conversion): number {
  const v = amount * conversion.rate;
  return Number.isFinite(v) ? v : 0;
}
