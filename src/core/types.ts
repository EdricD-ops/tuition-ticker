/** Calendar date in the school's time zone, formatted `YYYY-MM-DD`. */
export type PlainDate = string;
/** Wall-clock time in the school's time zone, formatted `HH:mm` (24h). */
export type PlainTime = string;
/** ISO weekday: 1 = Monday … 7 = Sunday. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Course {
  id: string;
  name: string;
  /** Start of each class, school-local. */
  start: PlainTime;
  /** End of each class, school-local. Must be later than `start` (no overnight classes). */
  end: PlainTime;
  /** Days of the week the course meets, at the same time each day. Classes per week = length. */
  weekdays: Weekday[];
  /** How many weeks the course runs, counted from the term start. Positive integer. */
  weeks: number;
}

export interface TickerConfig {
  /** The school, as shown on the dashboard (e.g. "香港大學 The University of Hong Kong"). */
  schoolName: string;
  /** The programme being studied, optional (e.g. "MSc Computer Science"). */
  programme: string;
  region: string;
  /** ISO 4217 code of the tuition currency, e.g. `HKD`. */
  currency: string;
  /** IANA time zone of the school, e.g. `Asia/Hong_Kong`. */
  timeZone: string;
  tuition: number;
  /** First day of the term; every course's weeks are counted from here. */
  termStart: PlainDate;
  courses: Course[];
  /** School holidays added by the user (reading week, school anniversary …). */
  customHolidays: Holiday[];
  /** Start dates of public holidays whose reminder the user turned off. */
  hiddenHolidays: PlainDate[];
  /** ISO 4217 code to convert into, or null to disable conversion. */
  displayCurrency: string | null;
  /**
   * Units of `displayCurrency` per 1 unit of `currency`, typed by the user to override the
   * daily reference rate. Null uses the reference rate.
   */
  fixedRate: number | null;
}

/** Text that is either a single string (user input) or localized (bundled data). */
export type LocalizedText = string | { en: string; zh: string };

/**
 * A day or range of days without class. Holidays only drive reminders: they never change
 * total class hours or the cost per second.
 */
export interface Holiday {
  date: PlainDate;
  /** Inclusive. Omit for a single day. */
  end?: PlainDate;
  name: LocalizedText;
  /** `compensatory`: a substitute rest day for public employees (e.g. Macau). */
  kind?: 'public' | 'compensatory';
}

/** Shape of `presets/holidays/{region}.json`. */
export interface HolidayCalendar {
  region: string;
  source: string;
  updated: PlainDate;
  note?: string;
  holidays: Holiday[];
}

/**
 * One concrete class: a course on a given school-local date. Created when the user picks a
 * course in class, and stored as attendance history. Times are epoch milliseconds.
 */
export interface ClassWindow {
  courseId: string;
  /** School-local date of the class. */
  date: PlainDate;
  start: number;
  end: number;
}
