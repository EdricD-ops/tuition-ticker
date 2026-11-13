import { dateInTimeZone, weekdayOf } from './dates';
import { holidayAt } from './holidays';
import { buildSessions, classWindowOn, courseSeconds, mergeIntervals, type Interval } from './schedule';
import type { ClassWindow, Course, Holiday, QuickSetup, TickerConfig } from './types';
import { isQuick, isValidCourse, isValidQuick, validateConfig, type Issue } from './validate';

/** `courseId` of a class started in quick mode, which has no courses. */
export const QUICK_COURSE_ID = 'quick';

export type TickerStatus =
  | 'unconfigured' // blocking config issues: nothing can be billed
  | 'idle' // no course picked
  | 'before-start' // course picked, today's class has not started yet
  | 'in-class'
  | 'finished'; // today's class of the picked course is over

export interface Plan {
  config: TickerConfig;
  issues: Issue[];
  /** True when nothing can be billed until the config is fixed. */
  blocked: boolean;
  /** The quick setup in use, or null when billing follows the timetable. */
  quick: QuickSetup | null;
  /** Valid courses only. Empty when blocked or in quick mode. */
  courses: Course[];
  /** Every scheduled class over the term, minus holidays, sorted by start. */
  sessions: ClassWindow[];
  /** Scheduled classes that fall on holidays and therefore are not held or billed. */
  skippedForHolidays: number;
  /** Scheduled class time with overlaps merged, sorted. */
  merged: Interval[];
  /** prefix[i] = total ms of merged[0..i-1]. */
  prefix: number[];
  /** Total billable class time (overlaps counted once). */
  totalSeconds: number;
  totalSessions: number;
  /** tuition ÷ totalSeconds. 0 when there are no class seconds or tuition is not positive. */
  costPerSecond: number;
}

export interface CurrentClass {
  window: ClassWindow;
  courseName: string;
  /** Seconds until the class starts; 0 once it has started. */
  startsInSeconds: number;
  elapsedSeconds: number;
  remainingSeconds: number;
  durationSeconds: number;
  spent: number;
  remainingCost: number;
  cost: number;
  progress: number; // 0..1
}

export interface Snapshot {
  status: TickerStatus;
  /** Quick mode: no timetable, so the term-to-date figures (spent, classes left) are 0. */
  quick: boolean;
  now: number;
  costPerSecond: number;
  current: CurrentClass | null;
  totals: {
    tuition: number;
    /** Scheduled class time elapsed since the term start, priced at the rate. */
    spent: number;
    remaining: number;
    progress: number; // 0..1, share of tuition already consumed
    sessionCount: number;
    /** Scheduled classes that have started, including one in progress. */
    sessionsStarted: number;
    /** Classes not yet started: excludes the one in progress. */
    sessionsRemaining: number;
    averageSessionCost: number;
  };
}

/**
 * Precomputes everything that only depends on the config. Call once per config change.
 *
 * Classes on a holiday (a school holiday, or a public holiday whose reminder is on) are
 * dropped: they are not held, so they neither count as spent nor as class time. The
 * tuition is spread over the remaining classes.
 */
export function createPlan(config: TickerConfig, publicHolidays: Holiday[] = []): Plan {
  const issues = validateConfig(config);
  const blocked = issues.some((i) => i.blocking);
  if (isQuick(config)) return createQuickPlan(config, issues, blocked);
  const courses = blocked ? [] : config.courses.filter(isValidCourse);
  const scheduled = blocked ? [] : buildSessions(courses, config.termStart, config.timeZone);
  const sessions = scheduled.filter((s) => !holidayAt(config, publicHolidays, s.date));
  const merged = mergeIntervals(sessions);

  const prefix = [0];
  for (const m of merged) prefix.push(prefix[prefix.length - 1]! + (m.end - m.start));
  const totalSeconds = prefix[prefix.length - 1]! / 1000;
  const costPerSecond = totalSeconds > 0 && config.tuition > 0 ? config.tuition / totalSeconds : 0;

  return {
    config,
    issues,
    blocked: blocked || courses.length === 0,
    quick: null,
    courses,
    sessions,
    skippedForHolidays: scheduled.length - sessions.length,
    merged,
    prefix,
    totalSeconds,
    totalSessions: sessions.length,
    costPerSecond,
  };
}

/**
 * Quick mode: total class time is simply classes × minutes. There is no timetable, so no
 * sessions to place in time and no holidays to drop.
 */
function createQuickPlan(config: TickerConfig, issues: Issue[], blocked: boolean): Plan {
  const quick = !blocked && isValidQuick(config.quick) ? config.quick : null;
  const totalSeconds = quick ? quick.classes * quick.minutes * 60 : 0;
  return {
    config,
    issues,
    blocked: quick === null,
    quick,
    courses: [],
    sessions: [],
    skippedForHolidays: 0,
    merged: [],
    prefix: [0],
    totalSeconds,
    totalSessions: quick ? quick.classes : 0,
    costPerSecond: totalSeconds > 0 && config.tuition > 0 ? config.tuition / totalSeconds : 0,
  };
}

/**
 * Quick mode: a class that started `elapsedMinutes` ago (0 = right now) and lasts the
 * configured length. Null when the plan is not in quick mode.
 */
export function startQuickClass(plan: Plan, now: number, elapsedMinutes = 0): ClassWindow | null {
  if (!plan.quick) return null;
  const length = plan.quick.minutes * 60_000;
  const elapsed = Math.min(Math.max(0, elapsedMinutes) * 60_000, length - 1000);
  const start = now - Math.max(0, elapsed);
  return {
    courseId: QUICK_COURSE_ID,
    date: dateInTimeZone(start, plan.config.timeZone),
    start,
    end: start + length,
  };
}

/** Number of items whose `start` is <= now (items sorted by start). */
function countStarted(items: Interval[], now: number): number {
  let lo = 0;
  let hi = items.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (items[mid]!.start <= now) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/** Billable class time elapsed up to `now`, in ms. */
function elapsedClassMs(plan: Plan, now: number): number {
  const i = countStarted(plan.merged, now);
  if (i === 0) return 0;
  const last = plan.merged[i - 1]!;
  return plan.prefix[i - 1]! + Math.min(now, last.end) - last.start;
}

/** Cost of one class of `course` at the plan's rate. */
export function courseCost(plan: Plan, course: Course): number {
  return courseSeconds(course) * plan.costPerSecond;
}

/**
 * Today's class (school-local date of `now`) for the course with `courseId`, or null if
 * the course does not exist or is invalid. Any course can be picked on any day (make-up
 * classes); the term totals follow the schedule regardless.
 */
export function startClass(plan: Plan, courseId: string, now: number): ClassWindow | null {
  const course = plan.courses.find((c) => c.id === courseId);
  return course ? classWindowOn(course, now, plan.config.timeZone) : null;
}

/** Whether `course` meets on the school-local weekday of `now`. */
export function meetsToday(plan: Plan, course: Course, now: number): boolean {
  return course.weekdays.includes(weekdayOf(dateInTimeZone(now, plan.config.timeZone)));
}

/**
 * Ids of courses scheduled today (school time zone) whose class time contains `now`. Used to
 * highlight likely picks; it never starts billing by itself.
 */
export function coursesInSession(plan: Plan, now: number): string[] {
  return plan.courses
    .filter((c) => {
      if (!meetsToday(plan, c, now)) return false;
      const w = classWindowOn(c, now, plan.config.timeZone);
      return w.start <= now && now < w.end;
    })
    .map((c) => c.id);
}

/**
 * Computes the full ticker state at instant `now` (epoch ms). Pure and stateless: safe to
 * call every animation frame, and opening the page mid-class gives the right figures
 * immediately.
 *
 * @param active The class the user picked for the live view, or null.
 */
export function getSnapshot(plan: Plan, active: ClassWindow | null, now: number): Snapshot {
  const { costPerSecond, totalSessions, config } = plan;
  const tuition = Math.max(0, config.tuition);
  const blocked = plan.blocked;

  const spent = Math.min(tuition, (elapsedClassMs(plan, now) / 1000) * costPerSecond);
  const sessionsStarted = countStarted(plan.sessions, now);

  let current: CurrentClass | null = null;
  let status: TickerStatus = blocked ? 'unconfigured' : 'idle';
  if (!blocked && active) {
    const durationSeconds = Math.max(0, (active.end - active.start) / 1000);
    const elapsedSeconds = Math.min(durationSeconds, Math.max(0, (now - active.start) / 1000));
    const cost = durationSeconds * costPerSecond;
    const name = config.courses.find((c) => c.id === active.courseId)?.name ?? '';
    current = {
      window: active,
      courseName: name,
      startsInSeconds: Math.max(0, (active.start - now) / 1000),
      elapsedSeconds,
      remainingSeconds: durationSeconds - elapsedSeconds,
      durationSeconds,
      spent: elapsedSeconds * costPerSecond,
      remainingCost: cost - elapsedSeconds * costPerSecond,
      cost,
      progress: durationSeconds > 0 ? elapsedSeconds / durationSeconds : 0,
    };
    status = now < active.start ? 'before-start' : now < active.end ? 'in-class' : 'finished';
  }

  return {
    status,
    quick: plan.quick !== null,
    now,
    costPerSecond,
    current,
    totals: {
      tuition,
      spent,
      remaining: Math.max(0, tuition - spent),
      progress: tuition > 0 ? spent / tuition : 0,
      sessionCount: totalSessions,
      sessionsStarted,
      sessionsRemaining: Math.max(0, totalSessions - sessionsStarted),
      averageSessionCost: totalSessions > 0 && costPerSecond > 0 ? tuition / totalSessions : 0,
    },
  };
}
