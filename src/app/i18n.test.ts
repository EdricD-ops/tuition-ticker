import { describe, expect, it } from 'vitest';
import { interpolate } from './i18n';

describe('interpolate', () => {
  it('adds spaces between Chinese and Latin text', () => {
    expect(interpolate('今天是{name}', { name: 'Reading Week' }, true)).toBe('今天是 Reading Week');
    expect(interpolate('今天是{name}，确定吗？', { name: 'Reading Week' }, true)).toBe(
      '今天是 Reading Week，确定吗？',
    );
    expect(interpolate('{n}节', { n: 24 }, true)).toBe('24 节');
  });

  it('leaves Chinese values and English templates alone', () => {
    expect(interpolate('今天是{name}', { name: '中秋节翌日' }, true)).toBe('今天是中秋节翌日');
    expect(interpolate('Today is {name}', { name: 'Reading Week' }, false)).toBe(
      'Today is Reading Week',
    );
  });
});
