import type { TickerConfig } from './types';

export function makeConfig(overrides: Partial<TickerConfig> = {}): TickerConfig {
  return {
    mode: 'full',
    quick: { classes: 0, minutes: 180 },
    schoolName: 'Test School',
    programme: '',
    region: 'HK',
    currency: 'HKD',
    timeZone: 'Asia/Hong_Kong',
    tuition: 10_800,
    termStart: '2026-09-07', // Monday
    // Mondays 09:00–12:00 for 1 week = 10,800 s → 1 HKD per second
    courses: [{ id: 'c1', name: 'Finance', start: '09:00', end: '12:00', weekdays: [1], weeks: 1 }],
    customHolidays: [],
    hiddenHolidays: [],
    displayCurrency: 'CNY',
    fixedRate: null,
    ...overrides,
  };
}
