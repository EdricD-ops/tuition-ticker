import { describe, expect, it } from 'vitest';
import { createPlan, getSnapshot } from '../core';
import { demoExpired, makeDemo } from './demo';

const iso = (s: string) => new Date(s).getTime();

describe('makeDemo', () => {
  it.each([
    '2026-11-10T06:15:00Z', // 14:15 HKT
    '2026-11-09T16:10:00Z', // 00:10 HKT, just after midnight
    '2026-11-10T15:40:00Z', // 23:40 HKT, near midnight
    '2026-11-10T01:00:00Z',
  ])('is in class at %s', (t) => {
    const now = iso(t);
    const demo = makeDemo(now);
    const plan = createPlan(demo.config);
    expect(plan.issues.filter((i) => i.blocking)).toEqual([]);
    expect(plan.issues).toEqual([]);
    const snap = getSnapshot(plan, demo.active, now);
    expect(snap.status).toBe('in-class');
    expect(snap.totals.progress).toBeGreaterThan(0.4);
    expect(snap.totals.progress).toBeLessThan(0.6);
    expect(snap.totals.sessionsRemaining).toBe(48 - 25);
    expect(demoExpired(demo, now)).toBe(false);
  });

  it('expires after the live class ends', () => {
    const now = iso('2026-11-10T06:15:00Z');
    const demo = makeDemo(now);
    expect(demoExpired(demo, demo.active.end)).toBe(true);
  });
});
