import { describe, expect, it } from 'vitest';
import { formatDuration, formatMoney, moneyParts, schoolLabel } from './format';

describe('formatMoney', () => {
  it('uses the configured decimals per kind', () => {
    expect(formatMoney(2689.94, 'HKD', 'live', 'en-US')).toBe('HK$2,689.9');
    expect(formatMoney(0.123456, 'HKD', 'rate', 'en-US')).toBe('HK$0.1235');
    expect(formatMoney(560000.4, 'HKD', 'total', 'en-US')).toBe('HK$560,000');
  });

  it('never prints NaN', () => {
    expect(formatMoney(Number.NaN, 'USD', 'total', 'en-US')).toBe('$0');
  });
});

describe('formatDuration', () => {
  it('formats HH:MM:SS without capping hours', () => {
    expect(formatDuration(0)).toBe('00:00:00');
    expect(formatDuration(3661.9)).toBe('01:01:01');
    expect(formatDuration(100 * 3600)).toBe('100:00:00');
    expect(formatDuration(-5)).toBe('00:00:00');
  });
});

describe('moneyParts', () => {
  it('exposes the currency symbol separately', () => {
    const parts = moneyParts(1234.56, 'HKD', 'live', 'en-US');
    expect(parts.find((p) => p.type === 'currency')?.value).toBe('HK$');
    expect(parts.map((p) => p.value).join('')).toBe('HK$1,234.6');
  });
});

describe('schoolLabel', () => {
  it('joins school and programme, skipping an empty programme', () => {
    expect(schoolLabel({ schoolName: '香港大學 The University of Hong Kong', programme: 'MSc CS' })).toBe(
      '香港大學 The University of Hong Kong · MSc CS',
    );
    expect(schoolLabel({ schoolName: ' UCL ', programme: '  ' })).toBe('UCL');
  });
});
