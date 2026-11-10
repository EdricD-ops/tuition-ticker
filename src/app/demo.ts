import {
  addDays,
  dateInTimeZone,
  timeToMinutes,
  weekdayOf,
  zonedToInstant,
  type ClassWindow,
  type Course,
  type TickerConfig,
  type Weekday,
} from '../core';

/** Fictional programme shown to first-time visitors. */
const DEMO_TZ = 'Asia/Hong_Kong';
const CLASS_MINUTES = 180;
/** How far into the live class the demo starts. */
const ELAPSED_MINUTES = 47;

const pad = (n: number) => String(n).padStart(2, '0');
const hhmm = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

function minutesOfDay(now: number): number {
  const [h, m] = new Intl.DateTimeFormat('en-GB', {
    timeZone: DEMO_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
    .format(now)
    .split(':')
    .map(Number);
  return h! * 60 + m!;
}

export interface Demo {
  config: TickerConfig;
  active: ClassWindow;
}

/**
 * Builds a demo whose first course is in progress at `now`, so the dashboard is always
 * "on class". The term started six weeks ago (of twelve), so about half the tuition is
 * already spent. The live course is kept inside one school-local day (no overnight
 * classes), which only fails during the last minute before midnight.
 */
export function makeDemo(now: number): Demo {
  const minute = minutesOfDay(now);
  const start = Math.min(Math.max(0, minute - ELAPSED_MINUTES), 24 * 60 - 1 - CLASS_MINUTES);
  const today = dateInTimeZone(now, DEMO_TZ);
  const wd = weekdayOf(today);
  const day = (offset: number) => ((((wd - 1 + offset) % 7) + 7) % 7) + 1 as Weekday;

  const courses: Course[] = [
    {
      id: 'demo-live',
      name: 'Corporate Finance',
      start: hhmm(start),
      end: hhmm(start + CLASS_MINUTES),
      weekdays: [day(0)],
      weeks: 12,
    },
    { id: 'demo-2', name: 'Derivatives', start: '09:30', end: '12:30', weekdays: [day(1)], weeks: 12 },
    { id: 'demo-3', name: 'Financial Econometrics', start: '14:00', end: '17:00', weekdays: [day(2)], weeks: 12 },
    { id: 'demo-4', name: 'Investments', start: '18:30', end: '21:30', weekdays: [day(4)], weeks: 12 },
  ];

  const config: TickerConfig = {
    schoolName: 'Harbour University',
    programme: 'MSc Finance',
    region: 'HK',
    currency: 'HKD',
    timeZone: DEMO_TZ,
    // 48 classes × 3 h = 144 h → about HK$0.81 per second
    tuition: 420_000,
    termStart: addDays(today, -42),
    courses,
    customHolidays: [],
    hiddenHolidays: [],
    displayCurrency: 'CNY',
    fixedRate: null,
  };

  const active: ClassWindow = {
    courseId: 'demo-live',
    date: today,
    start: zonedToInstant(today, courses[0]!.start, DEMO_TZ),
    end: zonedToInstant(today, courses[0]!.end, DEMO_TZ),
  };

  return { config, active };
}

/** True when `active` has ended and a fresh demo should be generated. */
export function demoExpired(demo: Demo, now: number): boolean {
  return now >= demo.active.end || timeToMinutes(demo.config.courses[0]!.start) > minutesOfDay(now);
}
