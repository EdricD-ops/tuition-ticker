import { describe, expect, it } from 'vitest';
import { makeConfig } from '../core/testUtils';
import { blankConfig, parseConfig, toExportFile } from './configIO';

describe('parseConfig', () => {
  it('round-trips an exported file', () => {
    const config = makeConfig({
      customHolidays: [{ date: '2026-10-05', end: '2026-10-09', name: 'Reading week' }],
      hiddenHolidays: ['2026-10-01'],
    });
    const file = JSON.parse(JSON.stringify(toExportFile(config)));
    expect(parseConfig(file)).toEqual(config);
  });

  it('accepts a bare config and fills in missing fields', () => {
    const parsed = parseConfig({
      region: 'hk',
      courses: [{ name: 'Law', start: '09:00', end: '10:00', weekdays: [3, 1, 3, 9], weeks: 14 }],
    });
    expect(parsed).toMatchObject({
      region: 'HK',
      currency: 'HKD',
      timeZone: 'Asia/Hong_Kong',
      tuition: 0,
      customHolidays: [],
      hiddenHolidays: [],
      displayCurrency: 'CNY',
    });
    expect(parsed?.courses[0]?.id).toBeTruthy();
    expect(parsed?.courses[0]?.weekdays).toEqual([1, 3]);
    expect(parsed?.termStart).toBe('');
  });

  it('migrates configs saved before weekdays existed', () => {
    const old = parseConfig({
      termStart: 'later',
      courses: [{ id: 'a', name: 'A', start: '09:00', end: '10:00', sessionsPerWeek: 2, weeks: 3 }],
    });
    expect(old?.courses[0]).toEqual({ id: 'a', name: 'A', start: '09:00', end: '10:00', weekdays: [], weeks: 3 });
  });

  it('drops malformed holidays and keeps conversion off when null', () => {
    const parsed = parseConfig({
      courses: [],
      customHolidays: [{ date: 'nope' }, { date: '2026-12-01', end: '2026-11-01', name: 'x' }],
      hiddenHolidays: ['2026-01-01', 42],
      displayCurrency: null,
    });
    expect(parsed?.customHolidays).toEqual([{ date: '2026-12-01', name: 'x' }]);
    expect(parsed?.hiddenHolidays).toEqual(['2026-01-01']);
    expect(parsed?.displayCurrency).toBeNull();
  });

  it('keeps a positive fixed rate and drops anything else', () => {
    expect(parseConfig({ courses: [], fixedRate: 0.88 })?.fixedRate).toBe(0.88);
    expect(parseConfig({ courses: [] })?.fixedRate).toBeNull();
    expect(parseConfig({ courses: [], fixedRate: 0 })?.fixedRate).toBeNull();
    expect(parseConfig({ courses: [], fixedRate: -1 })?.fixedRate).toBeNull();
    expect(parseConfig({ courses: [], fixedRate: '0.9' })?.fixedRate).toBeNull();
  });

  it('round-trips a fixed rate', () => {
    const config = makeConfig({ fixedRate: 0.91 });
    expect(parseConfig(JSON.parse(JSON.stringify(toExportFile(config))))).toEqual(config);
  });

  it('rejects things that are not configs', () => {
    expect(parseConfig(null)).toBeNull();
    expect(parseConfig({ hello: 'world' })).toBeNull();
    expect(parseConfig('{}')).toBeNull();
  });

  it('replaces an invalid time zone with the region default', () => {
    expect(parseConfig({ region: 'GB', timeZone: 'Mars/Base', courses: [] })?.timeZone).toBe(
      'Europe/London',
    );
  });
});

describe('blankConfig', () => {
  it('starts with one editable course', () => {
    const c = blankConfig();
    expect(c.courses).toHaveLength(1);
    expect(c.tuition).toBe(0);
  });
});

describe('programme', () => {
  it('defaults to empty for configs saved before it existed', () => {
    expect(parseConfig({ schoolName: 'UM MSc Data Science', courses: [] })?.programme).toBe('');
    expect(parseConfig({ schoolName: 'HKU', programme: 'MSc CS', courses: [] })?.programme).toBe('MSc CS');
  });
});
