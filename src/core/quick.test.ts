import { describe, expect, it } from 'vitest';
import { QUICK_COURSE_ID, createPlan, getSnapshot, startQuickClass } from './billing';
import { makeConfig } from './testUtils';

const iso = (s: string) => new Date(s).getTime();

// 40 classes × 3 h = 432,000 s; tuition 432,000 → 1 HKD per second, 10,800 per class.
const quick = makeConfig({
  mode: 'quick',
  quick: { classes: 40, minutes: 180 },
  tuition: 432_000,
  termStart: '',
  courses: [],
});

describe('quick mode', () => {
  it('bills tuition over classes × length, ignoring the timetable', () => {
    const plan = createPlan(quick);
    expect(plan.blocked).toBe(false);
    expect(plan.totalSeconds).toBe(432_000);
    expect(plan.totalSessions).toBe(40);
    expect(plan.costPerSecond).toBe(1);
    expect(plan.issues).toEqual([]);
  });

  it('is blocked until classes and length are valid', () => {
    for (const q of [
      { classes: 0, minutes: 180 },
      { classes: 2.5, minutes: 180 },
      { classes: 10, minutes: 0 },
      { classes: 10, minutes: 24 * 60 + 1 },
    ]) {
      const plan = createPlan({ ...quick, quick: q });
      expect(plan.blocked).toBe(true);
      expect(plan.costPerSecond).toBe(0);
      expect(getSnapshot(plan, null, iso('2026-09-07T10:00:00+08:00')).status).toBe('unconfigured');
    }
  });

  it('gives no cost per second without tuition, but no NaN either', () => {
    const plan = createPlan({ ...quick, tuition: 0 });
    expect(plan.costPerSecond).toBe(0);
    const snap = getSnapshot(plan, null, Date.now());
    expect(snap.totals.averageSessionCost).toBe(0);
    expect(Number.isNaN(snap.totals.progress)).toBe(false);
  });

  it('starts a class now, or minutes back, lasting the configured length', () => {
    const plan = createPlan(quick);
    const now = iso('2026-09-07T10:00:00+08:00');
    const win = startQuickClass(plan, now)!;
    expect(win).toEqual({ courseId: QUICK_COURSE_ID, date: '2026-09-07', start: now, end: now + 3 * 3600_000 });

    const late = startQuickClass(plan, now, 30)!;
    expect(late.start).toBe(now - 30 * 60_000);
    const snap = getSnapshot(plan, late, now);
    expect(snap.status).toBe('in-class');
    expect(snap.quick).toBe(true);
    expect(snap.current!.spent).toBe(1800);
    expect(snap.current!.cost).toBe(10_800);
    expect(snap.totals.averageSessionCost).toBe(10_800);
    // No timetable: nothing is counted as spent to date.
    expect(snap.totals.spent).toBe(0);
  });

  it('never starts a class that is already over', () => {
    const plan = createPlan(quick);
    const now = iso('2026-09-07T10:00:00+08:00');
    const win = startQuickClass(plan, now, 999)!;
    expect(win.end).toBeGreaterThan(now);
    expect(getSnapshot(plan, win, now).status).toBe('in-class');
  });

  it('dates the class in the school time zone', () => {
    const plan = createPlan({ ...quick, timeZone: 'Europe/London' });
    // 00:30 in Hong Kong on the 8th is still the 7th in London.
    expect(startQuickClass(plan, iso('2026-09-08T00:30:00+08:00'))!.date).toBe('2026-09-07');
  });

  it('only starts in quick mode', () => {
    expect(startQuickClass(createPlan(makeConfig()), Date.now())).toBeNull();
  });
});
