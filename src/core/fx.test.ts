import { describe, expect, it } from 'vitest';
import {
  RATE_TTL_MS,
  convert,
  isFresh,
  parseErApi,
  parseFrankfurter,
  resolveConversion,
  type RateTable,
} from './fx';

const T = Date.UTC(2026, 10, 10, 9, 0);

const erApi = {
  result: 'success',
  time_last_update_unix: Date.UTC(2026, 10, 10, 0, 2) / 1000,
  base_code: 'MOP',
  rates: { MOP: 1, CNY: 0.8838, HKD: 0.9709, JPY: 19.2, BAD: 'x', lower: 2, NEG: -1 },
};

const frankfurter = {
  amount: 1,
  base: 'HKD',
  date: '2026-11-09',
  rates: { CNY: 0.85094, USD: 0.12752 },
};

const table = (over: Partial<RateTable> = {}): RateTable => ({
  base: 'MOP',
  rates: { MOP: 1, CNY: 0.88 },
  asOf: '2026-11-10',
  provider: 'er-api',
  fetchedAt: T,
  ...over,
});

describe('parseErApi', () => {
  it('reads base, valid rates and the UTC publication date', () => {
    const t = parseErApi(erApi, 'mop', T)!;
    expect(t.base).toBe('MOP');
    expect(t.asOf).toBe('2026-11-10');
    expect(t.provider).toBe('er-api');
    expect(t.fetchedAt).toBe(T);
    expect(t.rates).toEqual({ MOP: 1, CNY: 0.8838, HKD: 0.9709, JPY: 19.2 });
  });

  it('rejects errors, mismatched bases and empty tables', () => {
    expect(parseErApi({ result: 'error', 'error-type': 'unsupported-code' }, 'XXX', T)).toBeNull();
    expect(parseErApi(erApi, 'HKD', T)).toBeNull();
    expect(parseErApi({ ...erApi, rates: {} }, 'MOP', T)).toBeNull();
    expect(parseErApi({ ...erApi, time_last_update_unix: 'soon' }, 'MOP', T)).toBeNull();
    expect(parseErApi(null, 'MOP', T)).toBeNull();
    expect(parseErApi('<html>', 'MOP', T)).toBeNull();
  });
});

describe('parseFrankfurter', () => {
  it('reads the table and adds the base itself', () => {
    const t = parseFrankfurter(frankfurter, 'HKD', T)!;
    expect(t.asOf).toBe('2026-11-09');
    expect(t.provider).toBe('frankfurter');
    expect(t.rates).toEqual({ HKD: 1, CNY: 0.85094, USD: 0.12752 });
  });

  it('rejects "not found" and malformed answers', () => {
    expect(parseFrankfurter({ message: 'not found' }, 'MOP', T)).toBeNull();
    expect(parseFrankfurter({ ...frankfurter, date: 'yesterday' }, 'HKD', T)).toBeNull();
    expect(parseFrankfurter(frankfurter, 'USD', T)).toBeNull();
  });
});

describe('isFresh', () => {
  it('is fresh within the TTL only', () => {
    expect(isFresh(table(), T)).toBe(true);
    expect(isFresh(table(), T + RATE_TTL_MS - 1)).toBe(true);
    expect(isFresh(table(), T + RATE_TTL_MS)).toBe(false);
  });

  it('treats a fetch time in the future (clock changed) as stale', () => {
    expect(isFresh(table({ fetchedAt: T + 60_000 }), T)).toBe(false);
  });
});

describe('resolveConversion', () => {
  const base = { from: 'MOP', to: 'CNY', fixedRate: null, table: table(), tableIsCurrent: true };

  it('uses the table rate', () => {
    expect(resolveConversion(base)).toEqual({
      from: 'MOP',
      to: 'CNY',
      rate: 0.88,
      source: 'live',
      asOf: '2026-11-10',
    });
  });

  it('marks a leftover table as cached', () => {
    expect(resolveConversion({ ...base, tableIsCurrent: false })?.source).toBe('cached');
  });

  it('prefers a positive fixed rate, even without a table', () => {
    expect(resolveConversion({ ...base, table: null, fixedRate: 0.9 })).toEqual({
      from: 'MOP',
      to: 'CNY',
      rate: 0.9,
      source: 'fixed',
      asOf: null,
    });
  });

  it('ignores non-positive or non-finite fixed rates', () => {
    expect(resolveConversion({ ...base, fixedRate: 0 })?.source).toBe('live');
    expect(resolveConversion({ ...base, fixedRate: -2 })?.source).toBe('live');
    expect(resolveConversion({ ...base, fixedRate: NaN })?.source).toBe('live');
  });

  it('returns null when conversion is off, pointless or impossible', () => {
    expect(resolveConversion({ ...base, to: null })).toBeNull();
    expect(resolveConversion({ ...base, to: 'MOP' })).toBeNull();
    expect(resolveConversion({ ...base, to: 'EUR' })).toBeNull();
    expect(resolveConversion({ ...base, from: 'HKD' })).toBeNull();
    expect(resolveConversion({ ...base, table: null })).toBeNull();
  });
});

describe('convert', () => {
  it('multiplies by the rate and never returns NaN', () => {
    const c = resolveConversion({
      from: 'MOP',
      to: 'CNY',
      fixedRate: 0.5,
      table: null,
      tableIsCurrent: false,
    })!;
    expect(convert(2689.9, c)).toBeCloseTo(1344.95);
    expect(convert(NaN, c)).toBe(0);
    expect(convert(Infinity, c)).toBe(0);
  });
});
