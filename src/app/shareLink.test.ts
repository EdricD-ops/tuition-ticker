import { describe, expect, it } from 'vitest';
import { makeConfig } from '../core/testUtils';
import { decodeConfig, encodeConfig, shareUrl, sharePayload } from './shareLink';

const config = makeConfig({
  schoolName: '海港大學 Harbour University · MSc Finance',
  region: 'HK',
  currency: 'HKD',
  timeZone: 'Asia/Hong_Kong',
  tuition: 250_000,
  courses: [
    { id: 'a', name: 'FINA6001', start: '18:00', end: '22:00', weekdays: [2], weeks: 14 },
    { id: 'b', name: 'MKTG6010', start: '14:00', end: '17:00', weekdays: [6], weeks: 14 },
  ],
  customHolidays: [{ date: '2026-10-19', end: '2026-10-23', name: 'Reading week' }],
  hiddenHolidays: ['2026-12-24'],
  fixedRate: 0.88,
});

describe('share links', () => {
  it('round-trips a config, including non-Latin text', async () => {
    const payload = await encodeConfig(config);
    expect(payload).toMatch(/^1\.[A-Za-z0-9_-]+$/);
    expect(await decodeConfig(payload)).toEqual(config);
  });

  it('is compact enough for a URL', async () => {
    expect((await encodeConfig(config)).length).toBeLessThan(600);
  });

  it('builds a link on the page address and reads it back', async () => {
    const url = await shareUrl(config, 'https://x.github.io/tuition-ticker/?view=mini#old');
    expect(url.startsWith('https://x.github.io/tuition-ticker/#share=1.')).toBe(true);
    const payload = sharePayload(new URL(url).hash)!;
    expect(await decodeConfig(payload)).toEqual(config);
  });

  it('rejects malformed payloads', async () => {
    expect(await decodeConfig('')).toBeNull();
    expect(await decodeConfig('2.abc')).toBeNull();
    expect(await decodeConfig('1.!!!')).toBeNull();
    expect(await decodeConfig('1.aGVsbG8')).toBeNull();
    expect(sharePayload('#other=1')).toBeNull();
    expect(sharePayload('')).toBeNull();
  });
});
