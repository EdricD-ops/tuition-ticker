import { describe, expect, it } from 'vitest';
import { isValidPlainDate } from './dates';
import { holidayOn, localize } from './holidays';
import { makeConfig } from './testUtils';
import type { Holiday, HolidayCalendar } from './types';

const iso = (s: string) => new Date(s).getTime();

const publicHolidays: Holiday[] = [
  { date: '2026-09-26', name: { en: 'The day following Mid-Autumn', zh: '中秋节翌日' } },
  { date: '2026-10-01', name: { en: 'National Day', zh: '国庆日' } },
];

describe('holidayOn', () => {
  const config = makeConfig();

  it('uses the school-local date', () => {
    // 2026-09-25T16:30Z is already 00:30 on 26 Sept in Hong Kong.
    expect(holidayOn(config, publicHolidays, iso('2026-09-25T16:30:00Z'))?.holiday.date).toBe(
      '2026-09-26',
    );
    expect(holidayOn(config, publicHolidays, iso('2026-09-25T15:30:00Z'))).toBeNull();
  });

  it('lets custom ranges win and covers every day of the range', () => {
    const c = makeConfig({
      customHolidays: [{ date: '2026-09-28', end: '2026-10-02', name: 'Reading week' }],
    });
    expect(holidayOn(c, publicHolidays, iso('2026-10-01T04:00:00Z'))).toEqual({
      holiday: c.customHolidays[0],
      source: 'custom',
    });
    expect(holidayOn(c, publicHolidays, iso('2026-10-02T04:00:00Z'))?.source).toBe('custom');
    expect(holidayOn(c, publicHolidays, iso('2026-10-03T04:00:00Z'))).toBeNull();
  });

  it('skips public holidays the user hid', () => {
    const c = makeConfig({ hiddenHolidays: ['2026-10-01'] });
    expect(holidayOn(c, publicHolidays, iso('2026-10-01T04:00:00Z'))).toBeNull();
  });
});

describe('localize', () => {
  it('picks the language and passes plain strings through', () => {
    const name = publicHolidays[1]!.name;
    expect(localize(name, 'zh-CN')).toBe('国庆日');
    expect(localize(name, 'en-GB')).toBe('National Day');
    expect(localize('Reading week', 'zh')).toBe('Reading week');
  });
});

describe('bundled holiday calendars', () => {
  const files = import.meta.glob<HolidayCalendar>('../../presets/holidays/*.json', {
    eager: true,
    import: 'default',
  });

  it('exist for HK and Macau', () => {
    const regions = Object.values(files).map((f) => f.region);
    expect(regions).toEqual(expect.arrayContaining(['HK', 'MO']));
  });

  it.each(Object.entries(files))('%s is well-formed and sorted', (_, cal) => {
    expect(cal.source).toMatch(/^https:\/\//);
    expect(isValidPlainDate(cal.updated)).toBe(true);
    expect(cal.holidays.length).toBeGreaterThan(0);
    const dates = cal.holidays.map((h) => h.date);
    expect([...dates].sort()).toEqual(dates);
    for (const h of cal.holidays) {
      expect(isValidPlainDate(h.date)).toBe(true);
      expect(typeof h.name === 'object' && h.name.en && h.name.zh).toBeTruthy();
    }
  });
});
