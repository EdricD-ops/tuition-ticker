import type { Holiday, HolidayCalendar } from '../core';

const files = import.meta.glob<HolidayCalendar>('../../presets/holidays/*.json', {
  eager: true,
  import: 'default',
});

const byRegion = new Map<string, Holiday[]>(
  Object.values(files).map((cal) => [cal.region.toUpperCase(), cal.holidays]),
);

/** Bundled public holidays for a region code such as `HK`, or an empty list. */
export function publicHolidaysFor(region: string): Holiday[] {
  return byRegion.get(region.toUpperCase()) ?? [];
}
