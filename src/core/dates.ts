import { formatInTimeZone } from 'date-fns-tz';
import type { PlainDate, Weekday } from './types';

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Parses a `YYYY-MM-DD` string into a UTC-midnight timestamp, or null if invalid. */
export function parsePlainDate(date: PlainDate): number | null {
  const m = DATE_RE.exec(date);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const ms = Date.UTC(y, mo - 1, d);
  const check = new Date(ms);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) {
    return null;
  }
  return ms;
}

export function isValidPlainDate(date: string): boolean {
  return parsePlainDate(date) !== null;
}

export function isValidPlainTime(time: string): boolean {
  return TIME_RE.test(time);
}

/** Minutes since midnight for an `HH:mm` string. Assumes it is valid. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h! * 60 + m!;
}

const DAY_MS = 86_400_000;

/** Shifts a plain calendar date by whole days. Assumes `date` is valid. */
export function addDays(date: PlainDate, days: number): PlainDate {
  return new Date(parsePlainDate(date)! + days * DAY_MS).toISOString().slice(0, 10);
}

/** ISO weekday (1 = Monday) of a plain calendar date. Independent of any time zone. */
export function weekdayOf(date: PlainDate): Weekday {
  const day = new Date(parsePlainDate(date)!).getUTCDay(); // 0 = Sunday
  return (day === 0 ? 7 : day) as Weekday;
}

export function isValidTimeZone(tz: string): boolean {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** The calendar date at instant `now` in `timeZone` (not the machine's local zone). */
export function dateInTimeZone(now: number, timeZone: string): PlainDate {
  return formatInTimeZone(now, timeZone, 'yyyy-MM-dd');
}
