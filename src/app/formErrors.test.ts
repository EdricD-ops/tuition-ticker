import { describe, expect, it } from 'vitest';
import { makeConfig } from '../core/testUtils';
import { coursesStepValid, formErrors, isFormValid, quickValid, schoolStepValid } from './formErrors';

describe('formErrors', () => {
  it('accepts a complete config', () => {
    expect(isFormValid(formErrors(makeConfig()))).toBe(true);
  });

  it('flags missing school name and tuition', () => {
    const e = formErrors(makeConfig({ schoolName: '  ', tuition: 0 }));
    expect(e.schoolName).toBe('errSchoolName');
    expect(e.tuition).toBe('errTuition');
    expect(schoolStepValid(e)).toBe(false);
    expect(coursesStepValid(e)).toBe(true);
  });

  it('flags each broken course separately', () => {
    const e = formErrors(
      makeConfig({
        courses: [
          { id: 'ok', name: 'A', start: '09:00', end: '10:00', weekdays: [1], weeks: 1 },
          { id: 'night', name: 'B', start: '22:00', end: '01:00', weekdays: [1], weeks: 1 },
          { id: 'frac', name: '', start: '09:00', end: '10:00', weekdays: [], weeks: 0 },
        ],
      }),
    );
    expect(e.byCourse.ok).toBeUndefined();
    expect(e.byCourse.night).toEqual({ time: 'errCourseTime' });
    expect(e.byCourse.frac).toEqual({
      name: 'errSchoolName',
      days: 'errCourseDays',
      count: 'errCourseCount',
    });
    expect(coursesStepValid(e)).toBe(false);
  });

  it('requires at least one course and a term start', () => {
    expect(formErrors(makeConfig({ courses: [] })).courses).toBe('errCourses');
    const e = formErrors(makeConfig({ termStart: '' }));
    expect(e.termStart).toBe('errTermStart');
    expect(coursesStepValid(e)).toBe(false);
  });

  it('quick setup needs only tuition, classes and length', () => {
    const base = makeConfig({ mode: 'quick', schoolName: '', termStart: '', courses: [] });
    const ok = formErrors({ ...base, quick: { classes: 40, minutes: 180 } });
    expect(isFormValid(ok)).toBe(true);

    const bad = formErrors({ ...base, tuition: 0, quick: { classes: 0, minutes: 0 } });
    expect(bad.tuition).toBe('errTuition');
    expect(bad.quickClasses).toBe('errCourseCount');
    expect(bad.quickMinutes).toBe('errQuickMinutes');
    expect(bad.schoolName).toBeUndefined();
    expect(quickValid(bad)).toBe(false);
  });
});
