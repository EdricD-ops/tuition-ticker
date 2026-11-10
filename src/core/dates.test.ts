import { describe, expect, it } from 'vitest';
import {
  addDays,
  dateInTimeZone,
  isValidPlainDate,
  isValidPlainTime,
  isValidTimeZone,
  weekdayOf,
} from './dates';

describe('dates', () => {
  it('validates dates including leap years', () => {
    expect(isValidPlainDate('2028-02-29')).toBe(true);
    expect(isValidPlainDate('2026-02-29')).toBe(false);
    expect(isValidPlainDate('2026-13-01')).toBe(false);
    expect(isValidPlainDate('2026-1-01')).toBe(false);
  });

  it('validates times', () => {
    expect(isValidPlainTime('09:30')).toBe(true);
    expect(isValidPlainTime('24:00')).toBe(false);
    expect(isValidPlainTime('9:30')).toBe(false);
  });

  it('validates IANA time zones', () => {
    expect(isValidTimeZone('Asia/Macau')).toBe(true);
    expect(isValidTimeZone('Mars/Olympus')).toBe(false);
    expect(isValidTimeZone('')).toBe(false);
  });

  it('reads the calendar date in the given zone', () => {
    const t = new Date('2026-09-06T17:00:00Z').getTime();
    expect(dateInTimeZone(t, 'Asia/Hong_Kong')).toBe('2026-09-07');
    expect(dateInTimeZone(t, 'Europe/London')).toBe('2026-09-06');
  });
});

describe('addDays', () => {
  it('crosses month and year ends', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
});

describe('weekdayOf', () => {
  it('computes ISO weekdays', () => {
    expect(weekdayOf('2026-11-09')).toBe(1); // Monday
    expect(weekdayOf('2026-11-15')).toBe(7); // Sunday
  });
});
