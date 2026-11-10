import { dateInTimeZone, isValidPlainDate } from './dates';
import type { Holiday, PlainDate, TickerConfig } from './types';

export interface HolidayMatch {
  holiday: Holiday;
  source: 'custom' | 'public';
}

function covers(h: Holiday, date: string): boolean {
  const end = h.end ?? h.date;
  return isValidPlainDate(h.date) && isValidPlainDate(end) && date >= h.date && date <= end;
}

/**
 * The holiday covering a school-local date, or null. User-added holidays win over public
 * ones; public holidays the user hid are treated as normal days (classes go ahead).
 */
export function holidayAt(
  config: Pick<TickerConfig, 'customHolidays' | 'hiddenHolidays'>,
  publicHolidays: Holiday[],
  date: PlainDate,
): HolidayMatch | null {
  const custom = config.customHolidays.find((h) => covers(h, date));
  if (custom) return { holiday: custom, source: 'custom' };
  const hidden = new Set(config.hiddenHolidays);
  const pub = publicHolidays.find((h) => !hidden.has(h.date) && covers(h, date));
  return pub ? { holiday: pub, source: 'public' } : null;
}

/**
 * The holiday on the school-local date of `now`, or null. "Today" is taken in the school's
 * time zone, so the answer does not depend on the machine's time zone.
 */
export function holidayOn(
  config: Pick<TickerConfig, 'timeZone' | 'customHolidays' | 'hiddenHolidays'>,
  publicHolidays: Holiday[],
  now: number,
): HolidayMatch | null {
  return holidayAt(config, publicHolidays, dateInTimeZone(now, config.timeZone));
}

/** Picks the display text for `lang` (anything starting with `zh` → Chinese). */
export function localize(text: Holiday['name'], lang: string): string {
  if (typeof text === 'string') return text;
  return lang.toLowerCase().startsWith('zh') ? text.zh : text.en;
}
