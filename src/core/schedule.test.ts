import { describe, expect, it } from 'vitest';
import { buildSessions, classWindowOn, courseSeconds, mergeIntervals, unionMs } from './schedule';
import type { Course } from './types';

const HOUR = 3_600_000;
const iso = (s: string) => new Date(s).getTime();
const course: Course = { id: 'c1', name: 'Finance', start: '09:00', end: '12:00', weekdays: [1], weeks: 1 };

describe('courseSeconds', () => {
  it('uses wall-clock length', () => {
    expect(courseSeconds(course)).toBe(3 * 3600);
    expect(courseSeconds({ ...course, start: '14:00', end: '15:30' })).toBe(5400);
  });
});

describe('classWindowOn', () => {
  it('interprets class times in the school time zone', () => {
    const win = classWindowOn(course, iso('2026-09-07T05:00:00Z'), 'Asia/Hong_Kong');
    expect(win.date).toBe('2026-09-07');
    expect(new Date(win.start).toISOString()).toBe('2026-09-07T01:00:00.000Z');
    expect(win.end - win.start).toBe(3 * HOUR);
  });

  it('uses the school date even when UTC is on a different day', () => {
    // 2026-09-08T03:00Z is still 7 Sept 23:00 in New York.
    const win = classWindowOn(course, iso('2026-09-08T03:00:00Z'), 'America/New_York');
    expect(win.date).toBe('2026-09-07');
    expect(new Date(win.start).toISOString()).toBe('2026-09-07T13:00:00.000Z');
  });
});

describe('buildSessions', () => {
  it('meets exactly weeks × weekdays times, even when the term starts mid-week', () => {
    // Term starts Thursday 10 Sept; Mon/Thu for 3 weeks.
    const s = buildSessions([{ ...course, weekdays: [1, 4], weeks: 3 }], '2026-09-10', 'Asia/Hong_Kong');
    expect(s.map((w) => w.date)).toEqual([
      '2026-09-10',
      '2026-09-14',
      '2026-09-17',
      '2026-09-21',
      '2026-09-24',
      '2026-09-28',
    ]);
  });

  it('follows daylight saving time', () => {
    // UK clocks go back on Sunday 25 Oct 2026: 09:00 is 08:00Z before, 09:00Z after.
    const s = buildSessions([{ ...course, weekdays: [5, 1], weeks: 1 }], '2026-10-23', 'Europe/London');
    expect(s.map((w) => new Date(w.start).toISOString())).toEqual([
      '2026-10-23T08:00:00.000Z',
      '2026-10-26T09:00:00.000Z',
    ]);
  });
});

describe('mergeIntervals / unionMs', () => {
  const w = (start: number, end: number) => ({ start, end });

  it('merges overlapping and touching intervals', () => {
    expect(mergeIntervals([w(0, 2 * HOUR), w(HOUR, 3 * HOUR), w(3 * HOUR, 4 * HOUR)])).toEqual([
      w(0, 4 * HOUR),
    ]);
    expect(unionMs([w(0, 2 * HOUR), w(HOUR, 3 * HOUR), w(10 * HOUR, 11 * HOUR)], Infinity)).toBe(
      4 * HOUR,
    );
  });

  it('clips to the given instant', () => {
    const windows = [w(0, 2 * HOUR), w(5 * HOUR, 6 * HOUR)];
    expect(unionMs(windows, HOUR)).toBe(HOUR);
    expect(unionMs(windows, 5.5 * HOUR)).toBe(2.5 * HOUR);
    expect(unionMs(windows, -1)).toBe(0);
  });
});
