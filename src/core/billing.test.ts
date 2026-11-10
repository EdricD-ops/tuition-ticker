import { describe, expect, it } from 'vitest';
import { courseCost, coursesInSession, createPlan, getSnapshot, startClass } from './billing';
import { makeConfig } from './testUtils';

const iso = (s: string) => new Date(s).getTime();

// Term starts Monday 7 Sept 2026 (Hong Kong).
// Finance: Mon + Wed 09:00–12:00 for 2 weeks = 4 classes, 43,200 s.
// Stats:   Tue 14:00–15:30 for 4 weeks      = 4 classes, 21,600 s.
// Total 64,800 s and 8 classes; tuition 64,800 → 1 HKD per second.
const config = makeConfig({
  tuition: 64_800,
  courses: [
    { id: 'fin', name: 'Finance', start: '09:00', end: '12:00', weekdays: [1, 3], weeks: 2 },
    { id: 'sta', name: 'Stats', start: '14:00', end: '15:30', weekdays: [2], weeks: 4 },
  ],
});
const plan = createPlan(config);

describe('createPlan', () => {
  it('expands weekdays over the weeks from term start', () => {
    expect(plan.totalSessions).toBe(8);
    expect(plan.totalSeconds).toBe(64_800);
    expect(plan.costPerSecond).toBe(1);
    expect(plan.sessions.filter((s) => s.courseId === 'fin').map((s) => s.date)).toEqual([
      '2026-09-07',
      '2026-09-09',
      '2026-09-14',
      '2026-09-16',
    ]);
    expect(courseCost(plan, config.courses[1]!)).toBe(5_400);
  });

  it('counts overlapping classes once', () => {
    const p = createPlan(
      makeConfig({
        tuition: 3 * 3600,
        courses: [
          { id: 'a', name: 'A', start: '09:00', end: '11:00', weekdays: [1], weeks: 1 },
          { id: 'b', name: 'B', start: '10:00', end: '12:00', weekdays: [1], weeks: 1 },
        ],
      }),
    );
    expect(p.totalSeconds).toBe(3 * 3600);
    expect(p.totalSessions).toBe(2);
  });

  it('ignores invalid courses and blocks without a term start', () => {
    const p = createPlan(
      makeConfig({
        courses: [
          ...makeConfig().courses,
          { id: 'night', name: 'N', start: '22:00', end: '01:00', weekdays: [1], weeks: 1 },
          { id: 'nodays', name: 'X', start: '09:00', end: '10:00', weekdays: [], weeks: 1 },
        ],
      }),
    );
    expect(p.issues.filter((i) => i.code === 'invalid-course').map((i) => i.ref)).toEqual([
      'night',
      'nodays',
    ]);
    expect(p.courses.map((c) => c.id)).toEqual(['c1']);

    const noStart = createPlan(makeConfig({ termStart: '' }));
    expect(noStart.issues.map((i) => i.code)).toContain('invalid-term-start');
    expect(getSnapshot(noStart, null, Date.now()).status).toBe('unconfigured');
  });

  it('never divides by zero', () => {
    const p = createPlan(makeConfig({ courses: [] }));
    expect(p.costPerSecond).toBe(0);
    const snap = getSnapshot(p, null, Date.now());
    expect(snap.status).toBe('unconfigured');
    expect(snap.totals.averageSessionCost).toBe(0);
    expect(Number.isNaN(snap.totals.progress)).toBe(false);
  });
});

describe('term totals follow the schedule', () => {
  it('are zero before the term starts', () => {
    const snap = getSnapshot(plan, null, iso('2026-09-01T00:00:00Z'));
    expect(snap.totals.spent).toBe(0);
    expect(snap.totals.sessionsRemaining).toBe(8);
  });

  it('accumulate past classes without the app being opened', () => {
    // Wed 9 Sept 10:00 HKT: Mon Finance (3h) + Tue Stats (1.5h) done, Wed Finance 1h in.
    const snap = getSnapshot(plan, null, iso('2026-09-09T02:00:00Z'));
    expect(snap.totals.spent).toBe(3 * 3600 + 5400 + 3600);
    expect(snap.totals.sessionsStarted).toBe(3);
    // The class in progress is not counted as remaining.
    expect(snap.totals.sessionsRemaining).toBe(5);
  });

  it('stop growing between classes', () => {
    const a = getSnapshot(plan, null, iso('2026-09-07T05:00:00Z'));
    const b = getSnapshot(plan, null, iso('2026-09-08T03:00:00Z'));
    expect(a.totals.spent).toBe(10_800);
    expect(b.totals.spent).toBe(10_800);
  });

  it('reach the full tuition after the last class', () => {
    const snap = getSnapshot(plan, null, iso('2027-01-01T00:00:00Z'));
    expect(snap.totals.spent).toBe(64_800);
    expect(snap.totals.remaining).toBe(0);
    expect(snap.totals.progress).toBe(1);
    expect(snap.totals.sessionsRemaining).toBe(0);
  });
});

describe('holidays', () => {
  it('drop classes on school and public holidays, raising the rate', () => {
    const p = createPlan(
      { ...config, customHolidays: [{ date: '2026-09-14', name: 'Reading day' }] },
      [{ date: '2026-09-08', name: { en: 'Public', zh: '公众假期' } }],
    );
    // Mon 14 Sept Finance (3h) and Tue 8 Sept Stats (1.5h) are skipped.
    expect(p.skippedForHolidays).toBe(2);
    expect(p.totalSessions).toBe(6);
    expect(p.totalSeconds).toBe(64_800 - 10_800 - 5_400);
    expect(p.costPerSecond).toBeCloseTo(64_800 / 48_600);
    // Wed 9 Sept 12:00 HKT: only Monday's Finance and Wednesday's Finance have happened.
    const snap = getSnapshot(p, null, iso('2026-09-09T04:00:00Z'));
    expect(snap.totals.sessionsStarted).toBe(2);
    expect(snap.totals.spent).toBeCloseTo(2 * 10_800 * (64_800 / 48_600));
  });

  it('keep classes on public holidays whose reminder is off', () => {
    const p = createPlan({ ...config, hiddenHolidays: ['2026-09-08'] }, [
      { date: '2026-09-08', name: 'Public' },
    ]);
    expect(p.skippedForHolidays).toBe(0);
    expect(p.totalSessions).toBe(8);
  });
});

describe('startClass and coursesInSession', () => {
  it("use today's date in the school time zone", () => {
    // 2026-09-06T17:00Z is already 01:00 on Monday 7 Sept in Hong Kong.
    const win = startClass(plan, 'fin', iso('2026-09-06T17:00:00Z'));
    expect(win?.date).toBe('2026-09-07');
    expect(new Date(win!.start).toISOString()).toBe('2026-09-07T01:00:00.000Z');
    expect(startClass(plan, 'nope', Date.now())).toBeNull();
  });

  it('only highlight courses that meet today', () => {
    const other = createPlan(
      makeConfig({
        courses: [
          { id: 'mon', name: 'Mon', start: '18:00', end: '22:00', weekdays: [1], weeks: 4 },
          { id: 'tue', name: 'Tue', start: '18:00', end: '22:00', weekdays: [2], weeks: 4 },
        ],
      }),
    );
    // Tuesday 8 Sept, 19:00 HKT
    expect(coursesInSession(other, iso('2026-09-08T11:00:00Z'))).toEqual(['tue']);
    // Tuesday 22:00 is the end, which is exclusive
    expect(coursesInSession(other, iso('2026-09-08T14:00:00Z'))).toEqual([]);
  });
});

describe('getSnapshot live class', () => {
  const monFin = startClass(plan, 'fin', iso('2026-09-07T00:00:00Z'))!;

  it('counts down before the class starts', () => {
    const snap = getSnapshot(plan, monFin, iso('2026-09-07T00:50:00Z'));
    expect(snap.status).toBe('before-start');
    expect(snap.current?.startsInSeconds).toBe(600);
    expect(snap.current?.spent).toBe(0);
  });

  it('computes correct figures when opened mid-class', () => {
    const snap = getSnapshot(plan, monFin, iso('2026-09-07T02:00:00Z'));
    expect(snap.status).toBe('in-class');
    expect(snap.current?.courseName).toBe('Finance');
    expect(snap.current?.elapsedSeconds).toBe(3600);
    expect(snap.current?.remainingCost).toBe(7200);
    expect(snap.current?.progress).toBeCloseTo(1 / 3);
    expect(snap.totals.spent).toBe(3600);
  });

  it('stops at the end time', () => {
    const snap = getSnapshot(plan, monFin, iso('2026-09-07T06:00:00Z'));
    expect(snap.status).toBe('finished');
    expect(snap.current?.spent).toBe(10_800);
  });

  it('is idle with no course picked', () => {
    const snap = getSnapshot(plan, null, iso('2026-09-07T02:00:00Z'));
    expect(snap.status).toBe('idle');
    expect(snap.current).toBeNull();
    expect(snap.totals.averageSessionCost).toBe(8_100);
  });

  it('is stateless', () => {
    const t = iso('2026-09-07T03:30:00Z');
    expect(getSnapshot(plan, monFin, t)).toEqual(getSnapshot(plan, monFin, t));
  });
});
