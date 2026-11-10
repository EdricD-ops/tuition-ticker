import { fromZonedTime } from 'date-fns-tz';
import { addDays, dateInTimeZone, timeToMinutes, weekdayOf } from './dates';
import type { ClassWindow, Course, PlainDate } from './types';

/** Converts a school-local wall-clock time into an epoch-ms instant (DST-aware). */
export function zonedToInstant(date: PlainDate, time: string, timeZone: string): number {
  return fromZonedTime(`${date}T${time}:00`, timeZone).getTime();
}

/** Nominal length of one class of `course`, from its wall-clock times. */
export function courseSeconds(course: Course): number {
  return (timeToMinutes(course.end) - timeToMinutes(course.start)) * 60;
}

/** The occurrence of `course` on a given school-local date. */
export function classWindowAt(course: Course, date: PlainDate, timeZone: string): ClassWindow {
  return {
    courseId: course.id,
    date,
    start: zonedToInstant(date, course.start, timeZone),
    end: zonedToInstant(date, course.end, timeZone),
  };
}

/**
 * The occurrence of `course` on the school-local date of `now`. Times are interpreted in the
 * school's time zone, so the result does not depend on the machine's time zone.
 */
export function classWindowOn(course: Course, now: number, timeZone: string): ClassWindow {
  return classWindowAt(course, dateInTimeZone(now, timeZone), timeZone);
}

/**
 * Every scheduled class: each course meets on its weekdays for `weeks` weeks counted from
 * `termStart` (so it meets exactly weeks × weekdays times). Sorted by start time.
 */
export function buildSessions(courses: Course[], termStart: PlainDate, timeZone: string): ClassWindow[] {
  const sessions: ClassWindow[] = [];
  for (const course of courses) {
    const days = new Set(course.weekdays);
    for (let i = 0; i < course.weeks * 7; i++) {
      const date = addDays(termStart, i);
      if (days.has(weekdayOf(date))) sessions.push(classWindowAt(course, date, timeZone));
    }
  }
  return sessions.sort((a, b) => a.start - b.start || a.end - b.end);
}

export interface Interval {
  start: number;
  end: number;
}

/** Merges overlapping or touching intervals so shared time is only counted once. */
export function mergeIntervals(windows: Interval[]): Interval[] {
  const sorted = windows
    .filter((w) => w.end > w.start)
    .map((w) => ({ start: w.start, end: w.end }))
    .sort((a, b) => a.start - b.start);
  const merged: Interval[] = [];
  for (const w of sorted) {
    const last = merged[merged.length - 1];
    if (last && w.start <= last.end) last.end = Math.max(last.end, w.end);
    else merged.push(w);
  }
  return merged;
}

/** Total milliseconds covered by the union of the intervals, each clipped to `until`. */
export function unionMs(windows: Interval[], until: number): number {
  let total = 0;
  for (const w of mergeIntervals(windows)) {
    if (w.start >= until) break;
    total += Math.min(w.end, until) - w.start;
  }
  return total;
}
