import { describe, expect, it, vi } from 'vitest';
import type { RateTable } from '../core';
import { fetchRateTable, readCachedRates, writeCachedRates } from './rates';

const NOW = Date.UTC(2026, 10, 10, 9, 0);

const erOk = {
  result: 'success',
  time_last_update_unix: Date.UTC(2026, 10, 10) / 1000,
  base_code: 'HKD',
  rates: { HKD: 1, CNY: 0.85 },
};
const fkOk = { amount: 1, base: 'HKD', date: '2026-11-09', rates: { CNY: 0.851 } };

const reply = (body: unknown, ok = true) => Promise.resolve({ ok, json: () => Promise.resolve(body) });

describe('fetchRateTable', () => {
  it('uses the primary source when it answers', async () => {
    const f = vi.fn((_url: string) => reply(erOk));
    const t = await fetchRateTable('HKD', f, () => NOW);
    expect(t?.provider).toBe('er-api');
    expect(t?.rates.CNY).toBe(0.85);
    expect(f).toHaveBeenCalledTimes(1);
    expect(f.mock.calls[0]![0]).toBe('https://open.er-api.com/v6/latest/HKD');
  });

  it('falls back to Frankfurter when the primary fails or answers badly', async () => {
    for (const first of [
      () => Promise.reject(new TypeError('offline')),
      () => reply({ result: 'error' }),
      () => reply({}, false),
    ]) {
      const f = vi.fn().mockImplementationOnce(first).mockImplementationOnce(() => reply(fkOk));
      const t = await fetchRateTable('HKD', f, () => NOW);
      expect(t?.provider).toBe('frankfurter');
      expect(f.mock.calls[1]![0]).toBe('https://api.frankfurter.dev/v1/latest?base=HKD');
    }
  });

  it('returns null when every source fails', async () => {
    const f = vi.fn(() => Promise.reject(new TypeError('offline')));
    expect(await fetchRateTable('HKD', f, () => NOW)).toBeNull();
    expect(f).toHaveBeenCalledTimes(2);
  });

  it('survives invalid JSON', async () => {
    const f = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.reject(new SyntaxError('x')) }));
    expect(await fetchRateTable('HKD', f, () => NOW)).toBeNull();
  });
});

describe('rate cache', () => {
  const memory = () => {
    const m = new Map<string, string>();
    return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
  };
  const table: RateTable = {
    base: 'HKD',
    rates: { HKD: 1, CNY: 0.85 },
    asOf: '2026-11-10',
    provider: 'er-api',
    fetchedAt: NOW,
  };

  it('round-trips a table per base currency', () => {
    const s = memory();
    writeCachedRates(table, s);
    expect(readCachedRates('hkd', s)).toEqual(table);
    expect(readCachedRates('MOP', s)).toBeNull();
  });

  it('ignores corrupt or mismatched entries', () => {
    const s = memory();
    s.m.set('tuition-ticker:rates:HKD', '{not json');
    expect(readCachedRates('HKD', s)).toBeNull();
    s.m.set('tuition-ticker:rates:HKD', JSON.stringify({ ...table, base: 'MOP' }));
    expect(readCachedRates('HKD', s)).toBeNull();
  });

  it('copes with storage that throws', () => {
    const broken = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('full');
      },
    };
    expect(readCachedRates('HKD', broken)).toBeNull();
    expect(() => writeCachedRates(table, broken)).not.toThrow();
  });
});
