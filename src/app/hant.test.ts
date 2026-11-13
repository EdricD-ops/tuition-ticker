import { describe, expect, it } from 'vitest';
import hk from '../../presets/holidays/hk.json';
import mo from '../../presets/holidays/mo.json';
import quips from '../data/quips.json';
import { toHans, toHant } from './hant';
import { REGIONS } from './regions';

describe('toHant', () => {
  it('converts bundled data to Traditional', () => {
    expect(toHant('农历年初一')).toBe('農曆年初一');
    expect(toHant('圣诞节后第一个周日')).toBe('聖誕節後第一個周日');
    expect(toHant('复活节星期一')).toBe('復活節星期一');
    expect(toHant('国立台湾师范大学')).toBe('國立台灣師範大學');
    expect(toHant('澳门')).toBe('澳門');
    expect(toHant('走神一分钟，大概等于一杯奶茶')).toBe('走神一分鐘，大概等於一杯奶茶');
    expect(toHant('睡着也计费，醒着更划算')).toBe('睡著也計費，醒著更划算');
  });

  it('keeps names whose characters differ from the usual conversion', () => {
    expect(toHant('于默奥大学')).toBe('于默奧大學');
    expect(toHant('佛罗里达大学')).toBe('佛羅里達大學');
    expect(toHant('塔什干')).toBe('塔什干');
  });

  it('leaves Latin text alone', () => {
    expect(toHant('Reading Week 2026')).toBe('Reading Week 2026');
  });

  it('maps back to Simplified for search', () => {
    expect(toHans('劍橋大學')).toBe('剑桥大学');
    expect(toHans('國立臺灣大學')).toBe('国立台湾大学');
  });

  it('turns every bundled Simplified string into one that round-trips', () => {
    const texts = [
      ...REGIONS.map((r) => r.name.zh),
      ...[...hk.holidays, ...mo.holidays].map((h) => h.name.zh),
      ...quips.zh,
    ];
    for (const s of texts) expect(toHans(toHant(s)), s).toBe(s);
  });
});
