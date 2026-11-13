import {
  MAX_QUICK_MINUTES,
  isQuick,
  isValidPlainDate,
  isValidPlainTime,
  timeToMinutes,
  type Course,
  type TickerConfig,
} from '../core';
import type { MessageKey } from './i18n';

export interface CourseErrors {
  name?: MessageKey;
  days?: MessageKey;
  time?: MessageKey;
  count?: MessageKey;
}

export interface FormErrors {
  schoolName?: MessageKey;
  tuition?: MessageKey;
  termStart?: MessageKey;
  courses?: MessageKey;
  byCourse: Record<string, CourseErrors>;
  /** Quick setup only. */
  quickClasses?: MessageKey;
  quickMinutes?: MessageKey;
}

const positiveInt = (n: number) => Number.isInteger(n) && n > 0;

export function courseErrors(c: Course): CourseErrors {
  const e: CourseErrors = {};
  if (!c.name.trim()) e.name = 'errSchoolName';
  if (
    !isValidPlainTime(c.start) ||
    !isValidPlainTime(c.end) ||
    timeToMinutes(c.end) <= timeToMinutes(c.start)
  ) {
    e.time = 'errCourseTime';
  }
  if (c.weekdays.length === 0) e.days = 'errCourseDays';
  if (!positiveInt(c.weeks)) e.count = 'errCourseCount';
  return e;
}

/**
 * Quick setup asks for tuition, number of classes and class length only: the school is
 * optional and the timetable is ignored.
 */
function quickErrors(config: TickerConfig): FormErrors {
  const q = config.quick;
  return {
    ...(config.tuition > 0 ? {} : { tuition: 'errTuition' as const }),
    ...(q && positiveInt(q.classes) ? {} : { quickClasses: 'errCourseCount' as const }),
    ...(q && q.minutes > 0 && q.minutes <= MAX_QUICK_MINUTES ? {} : { quickMinutes: 'errQuickMinutes' as const }),
    byCourse: {},
  };
}

/** Everything that blocks saving, keyed so each field can show its own message. */
export function formErrors(config: TickerConfig): FormErrors {
  if (isQuick(config)) return quickErrors(config);
  const byCourse: Record<string, CourseErrors> = {};
  for (const c of config.courses) {
    const e = courseErrors(c);
    if (Object.keys(e).length > 0) byCourse[c.id] = e;
  }
  return {
    ...(config.schoolName.trim() ? {} : { schoolName: 'errSchoolName' as const }),
    ...(config.tuition > 0 ? {} : { tuition: 'errTuition' as const }),
    ...(isValidPlainDate(config.termStart) ? {} : { termStart: 'errTermStart' as const }),
    ...(config.courses.length > 0 ? {} : { courses: 'errCourses' as const }),
    byCourse,
  };
}

export function schoolStepValid(e: FormErrors): boolean {
  return !e.schoolName && !e.tuition;
}

export function coursesStepValid(e: FormErrors): boolean {
  return !e.termStart && !e.courses && Object.keys(e.byCourse).length === 0;
}

export function quickValid(e: FormErrors): boolean {
  return !e.tuition && !e.quickClasses && !e.quickMinutes;
}

export function isFormValid(e: FormErrors): boolean {
  return schoolStepValid(e) && coursesStepValid(e) && quickValid(e);
}
