import { isValidPlainDate, isValidPlainTime, isValidTimeZone, timeToMinutes } from './dates';
import type { Course, QuickSetup, TickerConfig } from './types';

/** Longest class quick setup accepts: a full day. */
export const MAX_QUICK_MINUTES = 24 * 60;

export const isQuick = (config: TickerConfig): boolean => config.mode === 'quick';

export function isValidQuick(q: QuickSetup | undefined): q is QuickSetup {
  return (
    !!q &&
    Number.isInteger(q.classes) &&
    q.classes > 0 &&
    Number.isFinite(q.minutes) &&
    q.minutes > 0 &&
    q.minutes <= MAX_QUICK_MINUTES
  );
}

export type IssueCode =
  | 'invalid-timezone'
  | 'invalid-term-start'
  | 'invalid-course'
  | 'no-courses'
  | 'non-positive-tuition'
  | 'invalid-quick';

export interface Issue {
  code: IssueCode;
  /** True if the ticker cannot compute anything meaningful until this is fixed. */
  blocking: boolean;
  /** Id of the offending course. */
  ref?: string;
}

const isPositiveInt = (n: number) => Number.isInteger(n) && n > 0;
const isWeekday = (d: number) => Number.isInteger(d) && d >= 1 && d <= 7;

export function isValidCourse(c: Course): boolean {
  return (
    isValidPlainTime(c.start) &&
    isValidPlainTime(c.end) &&
    timeToMinutes(c.end) > timeToMinutes(c.start) &&
    Array.isArray(c.weekdays) &&
    c.weekdays.length > 0 &&
    c.weekdays.every(isWeekday) &&
    isPositiveInt(c.weeks)
  );
}

export function validateConfig(config: TickerConfig): Issue[] {
  const issues: Issue[] = [];

  if (!isValidTimeZone(config.timeZone)) {
    issues.push({ code: 'invalid-timezone', blocking: true });
  }

  if (isQuick(config)) {
    if (!isValidQuick(config.quick)) issues.push({ code: 'invalid-quick', blocking: true });
    if (!(config.tuition > 0)) issues.push({ code: 'non-positive-tuition', blocking: false });
    return issues;
  }

  if (!isValidPlainDate(config.termStart)) {
    issues.push({ code: 'invalid-term-start', blocking: true });
  }

  for (const course of config.courses) {
    if (!isValidCourse(course)) issues.push({ code: 'invalid-course', blocking: false, ref: course.id });
  }

  if (!config.courses.some(isValidCourse)) {
    issues.push({ code: 'no-courses', blocking: true });
  }

  if (!(config.tuition > 0)) {
    issues.push({ code: 'non-positive-tuition', blocking: false });
  }

  return issues;
}
