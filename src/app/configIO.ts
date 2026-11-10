import {
  isValidPlainDate,
  isValidTimeZone,
  type Course,
  type Holiday,
  type TickerConfig,
  type Weekday,
} from '../core';
import { findRegion, guessRegion } from './regions';

/** Version tag written into exported files, so future formats can migrate old ones. */
export const EXPORT_VERSION = 1;

export interface ExportFile {
  app: 'tuition-ticker';
  version: number;
  exportedAt: string;
  config: TickerConfig;
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback);
const num = (v: unknown, fallback = 0): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : fallback;

export function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2, 10);
  }
}

function toCourse(v: unknown): Course | null {
  if (!isObject(v)) return null;
  return {
    id: str(v.id) || newId(),
    name: str(v.name),
    start: str(v.start),
    end: str(v.end),
    // Configs saved before weekdays existed have none; the user picks them in settings.
    weekdays: Array.isArray(v.weekdays)
      ? [...new Set(v.weekdays.filter((d): d is Weekday => Number.isInteger(d) && d >= 1 && d <= 7))].sort((a, b) => a - b)
      : [],
    weeks: num(v.weeks),
  };
}

function toHoliday(v: unknown): Holiday | null {
  if (!isObject(v) || !isValidPlainDate(str(v.date))) return null;
  const end = str(v.end);
  return {
    date: str(v.date),
    ...(isValidPlainDate(end) && end > str(v.date) ? { end } : {}),
    name: str(v.name),
  };
}

/**
 * Turns untrusted JSON (an exported file or a bare config) into a config, filling in any
 * missing fields. Returns null when it does not look like a Tuition Ticker config at all.
 */
export function parseConfig(input: unknown): TickerConfig | null {
  const raw = isObject(input) && isObject(input.config) ? input.config : input;
  if (!isObject(raw) || !Array.isArray(raw.courses)) return null;

  const region = findRegion(str(raw.region)) ?? guessRegion();
  const timeZone = str(raw.timeZone);
  const display = raw.displayCurrency;
  return {
    schoolName: str(raw.schoolName),
    programme: str(raw.programme),
    region: region.code,
    currency: str(raw.currency, region.currency).toUpperCase() || region.currency,
    timeZone: isValidTimeZone(timeZone) ? timeZone : region.timeZones[0]!,
    tuition: Math.max(0, num(raw.tuition)),
    termStart: isValidPlainDate(str(raw.termStart)) ? str(raw.termStart) : '',
    courses: raw.courses.map(toCourse).filter((c): c is Course => c !== null),
    customHolidays: Array.isArray(raw.customHolidays)
      ? raw.customHolidays.map(toHoliday).filter((h): h is Holiday => h !== null)
      : [],
    hiddenHolidays: Array.isArray(raw.hiddenHolidays)
      ? raw.hiddenHolidays.filter((d): d is string => typeof d === 'string' && isValidPlainDate(d))
      : [],
    displayCurrency: display === null ? null : str(display, 'CNY').toUpperCase() || 'CNY',
    fixedRate: num(raw.fixedRate) > 0 ? num(raw.fixedRate) : null,
  };
}

export function toExportFile(config: TickerConfig, now = new Date()): ExportFile {
  return { app: 'tuition-ticker', version: EXPORT_VERSION, exportedAt: now.toISOString(), config };
}

/** Starting point for the setup wizard. */
export function blankConfig(): TickerConfig {
  const region = guessRegion();
  return {
    schoolName: '',
    programme: '',
    region: region.code,
    currency: region.currency,
    timeZone: region.timeZones[0]!,
    tuition: 0,
    termStart: '',
    courses: [{ id: newId(), name: '', start: '09:00', end: '12:00', weekdays: [], weeks: 13 }],
    customHolidays: [],
    hiddenHolidays: [],
    displayCurrency: region.currency === 'CNY' ? null : 'CNY',
    fixedRate: null,
  };
}

/** A fixed rate belongs to one currency pair, so changing the tuition currency clears it. */
export function withCurrency(draft: TickerConfig, currency: string): TickerConfig {
  return currency === draft.currency ? draft : { ...draft, currency, fixedRate: null };
}
