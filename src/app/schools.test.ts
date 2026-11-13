import { describe, expect, it } from 'vitest';
import data from '../../presets/schools.json';
import { isValidTimeZone } from '../core';
import { findRegion } from './regions';
import { indexSchools, schoolDisplayName, searchSchools, type SchoolList } from './schools';

const list = data as SchoolList;
const index = indexSchools(list.schools);
const top = (q: string) => searchSchools(index, q)[0]?.id;

describe('school list', () => {
  it('has the QS top 500 outside mainland China, each well-formed', () => {
    expect(list.schools.length).toBeGreaterThan(400);
    const ids = new Set<string>();
    for (const s of list.schools) {
      expect(s.name.trim(), s.id).not.toBe('');
      expect(s.zh.trim(), s.id).not.toBe('');
      expect(findRegion(s.country), `${s.id} region`).toBeDefined();
      expect(s.country, s.id).not.toBe('CN');
      expect(isValidTimeZone(s.timeZone), `${s.id} ${s.timeZone}`).toBe(true);
      expect(ids.has(s.id), `duplicate ${s.id}`).toBe(false);
      ids.add(s.id);
    }
  });

  it('writes the local-script name first where there is one', () => {
    const hku = list.schools.find((s) => s.id === 'the-university-of-hong-kong')!;
    expect(schoolDisplayName(hku)).toBe('香港大學 The University of Hong Kong');
    const ucl = list.schools.find((s) => s.id === 'university-college-london')!;
    expect(schoolDisplayName(ucl)).toBe('University College London');
  });
});

describe('searchSchools', () => {
  it.each([
    ['HKU', 'the-university-of-hong-kong'],
    ['hku', 'the-university-of-hong-kong'],
    ['港大', 'the-university-of-hong-kong'],
    ['香港大学', 'the-university-of-hong-kong'],
    ['香港大學', 'the-university-of-hong-kong'],
    ['The University of Hong Kong', 'the-university-of-hong-kong'],
    ['university of hong kong', 'the-university-of-hong-kong'],
    ['CUHK', 'the-chinese-university-of-hong-kong'],
    ['UCL', 'university-college-london'],
    ['帝国理工', 'imperial-college-london'],
    ['東京大学', 'the-university-of-tokyo'],
    ['东京大学', 'the-university-of-tokyo'],
    ['港科大', 'the-hong-kong-university-of-science-and-technology'],
    ['CityU', 'city-university-of-hong-kong'],
    ['NUS', 'national-university-of-singapore'],
    ['台大', 'national-taiwan-university'],
    ['eth', 'eth-zurich'],
    ['zurich', 'eth-zurich'],
    ['munchen', 'ludwig-maximilians-universitat-munchen'],
  ])('%s → %s', (q, id) => {
    expect(top(q)).toBe(id);
  });

  it('returns nothing for empty input and caps the list', () => {
    expect(searchSchools(index, '  ')).toEqual([]);
    expect(searchSchools(index, 'university', 5)).toHaveLength(5);
  });
});

describe('Traditional Chinese search', () => {
  it('finds schools typed in either script', () => {
    expect(top('劍橋')).toBeDefined();
    expect(top('劍橋')).toBe(top('剑桥'));
    expect(top('香港大学')).toBe(top('香港大學'));
  });
});
