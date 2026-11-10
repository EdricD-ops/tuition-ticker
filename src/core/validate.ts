import { isValidPlainDate, isValidPlainTime, isValidTimeZone, timeToMinutes } from './dates';
import type { Course, TickerConfig } from './types';

export type IssueCode =
  | 'invalid-timezone'
  | 'invalid-term-start'
  | 'invalid-course'
  | 'no-courses'
  | 'non-positive-tuition';

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
