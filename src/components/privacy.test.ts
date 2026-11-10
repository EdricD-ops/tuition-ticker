import { describe, expect, it } from 'vitest';
import { isMasked, nextLevel } from './Privacy';

describe('privacy levels', () => {
  it('masks nothing at 0, tuition-scale amounts at 1, everything at 2', () => {
    expect(isMasked(0, 'class')).toBe(false);
    expect(isMasked(0, 'tuition')).toBe(false);
    expect(isMasked(1, 'class')).toBe(false);
    expect(isMasked(1, 'tuition')).toBe(true);
    expect(isMasked(2, 'class')).toBe(true);
    expect(isMasked(2, 'tuition')).toBe(true);
  });

  it('cycles 0 → 1 → 2 → 0', () => {
    expect(nextLevel(0)).toBe(1);
    expect(nextLevel(1)).toBe(2);
    expect(nextLevel(2)).toBe(0);
  });
});
