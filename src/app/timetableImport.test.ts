import { describe, expect, it } from 'vitest';
import {
  DEFAULT_WEEKS,
  csvTemplate,
  parseIcs,
  parseTable,
  parseText,
  parseWeekdayCell,
  weekdaysInText,
} from './timetableImport';

const strip = (courses: { id: string }[]) => courses.map(({ id: _id, ...rest }) => rest);

describe('weekday parsing', () => {
  it('reads English, Chinese and numbers', () => {
    expect(weekdaysInText('Tue/Thu')).toEqual([2, 4]);
    expect(weekdaysInText('周二、星期四 and Saturday')).toEqual([2, 4, 6]);
    expect(weekdaysInText('Statistics')).toEqual([]); // "sat" inside a word is not a day
    expect(parseWeekdayCell('1;3')).toEqual([1, 3]);
    expect(parseWeekdayCell('二四')).toEqual([2, 4]);
    expect(parseWeekdayCell('Mon')).toEqual([1]);
  });
});

describe('parseTable', () => {
  it('reads the template back', () => {
    expect(strip(parseTable(csvTemplate(true)))).toEqual([
      { name: 'Corporate Finance', weekdays: [2, 4], start: '18:00', end: '21:00', weeks: 13 },
      { name: 'Statistics', weekdays: [6], start: '09:30', end: '12:30', weeks: 13 },
    ]);
    expect(strip(parseTable(csvTemplate(false)))).toHaveLength(2);
  });

  it('accepts tab-separated rows without a header, a single time-range cell, and quotes', () => {
    const tsv = '"Law, Intro"\tMon\t9:00-12:00\t\t\nEthics\tWed\t14:00\t16:00\t10';
    expect(strip(parseTable(tsv))).toEqual([
      { name: 'Law, Intro', weekdays: [1], start: '09:00', end: '12:00', weeks: DEFAULT_WEEKS },
      { name: 'Ethics', weekdays: [3], start: '14:00', end: '16:00', weeks: 10 },
    ]);
  });

  it('merges rows of the same course and time', () => {
    const csv = 'course,weekdays,start,end,weeks\nML,Tue,18:00,22:00,14\nML,Thu,18:00,22:00,14';
    expect(strip(parseTable(csv))).toEqual([
      { name: 'ML', weekdays: [2, 4], start: '18:00', end: '22:00', weeks: 14 },
    ]);
  });

  it('skips rows with bad times or no weekday', () => {
    expect(parseTable('A,Mon,22:00,01:00\nB,,09:00,10:00')).toEqual([]);
  });
});

describe('parseText', () => {
  it('reads one class per line', () => {
    const text = `FINA6001 Corporate Finance  周二 18:00-22:00
FINA6003 Derivatives | Thu | 18:00 – 22:00
MKTG6010 Marketing Management 星期六 14:00~17:00`;
    expect(strip(parseText(text))).toEqual([
      { name: 'FINA6001 Corporate Finance', weekdays: [2], start: '18:00', end: '22:00', weeks: 13 },
      { name: 'FINA6003 Derivatives', weekdays: [4], start: '18:00', end: '22:00', weeks: 13 },
      { name: 'MKTG6010 Marketing Management', weekdays: [6], start: '14:00', end: '17:00', weeks: 13 },
    ]);
  });

  it('uses day headings for the lines below them', () => {
    const text = `Monday
Accounting 09:00-12:00
Tuesday
Accounting 09:00-12:00
Economics 14:00-16:00`;
    expect(strip(parseText(text))).toEqual([
      { name: 'Accounting', weekdays: [1, 2], start: '09:00', end: '12:00', weeks: 13 },
      { name: 'Economics', weekdays: [2], start: '14:00', end: '16:00', weeks: 13 },
    ]);
  });

  it('falls back to the table parser for pasted spreadsheets', () => {
    expect(parseText('课程名\t星期\t开始\t结束\t周数\nLaw\t周一\t09:00\t12:00\t12')).toHaveLength(1);
  });
});

describe('parseIcs', () => {
  const ics = (body: string) => `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${body}END:VCALENDAR\r\n`;

  it('reads weekly recurring events with COUNT', () => {
    const r = parseIcs(
      ics(`BEGIN:VEVENT
SUMMARY:FINA6001 Corporate Finance
DTSTART;TZID=Asia/Hong_Kong:20260908T180000
DTEND;TZID=Asia/Hong_Kong:20260908T220000
RRULE:FREQ=WEEKLY;BYDAY=TU,TH;COUNT=28
END:VEVENT
`),
      'Asia/Hong_Kong',
    );
    expect(strip(r.courses)).toEqual([
      { name: 'FINA6001 Corporate Finance', weekdays: [2, 4], start: '18:00', end: '22:00', weeks: 14 },
    ]);
    expect(r.termStart).toBe('2026-09-08');
  });

  it('converts UTC times into the school zone and uses UNTIL', () => {
    const r = parseIcs(
      ics(`BEGIN:VEVENT
SUMMARY:Marketing
DTSTART:20260912T060000Z
DTEND:20260912T090000Z
RRULE:FREQ=WEEKLY;UNTIL=20261205T090000Z
END:VEVENT
`),
      'Asia/Hong_Kong',
    );
    // 06:00Z = 14:00 in Hong Kong; 12 Sept to 5 Dec is 12 weeks → 13 classes
    expect(strip(r.courses)).toEqual([
      { name: 'Marketing', weekdays: [6], start: '14:00', end: '17:00', weeks: 13 },
    ]);
  });

  it('groups one-off events by title and time', () => {
    const ev = (date: string) => `BEGIN:VEVENT
SUMMARY:Law\\, Intro
DTSTART:${date}T090000
DTEND:${date}T120000
END:VEVENT
`;
    const r = parseIcs(ics(ev('20260907') + ev('20260914') + ev('20260928') + ev('20260909')), 'Asia/Hong_Kong');
    expect(strip(r.courses)).toEqual([
      { name: 'Law, Intro', weekdays: [1, 3], start: '09:00', end: '12:00', weeks: 4 },
    ]);
    expect(r.termStart).toBe('2026-09-07');
  });

  it('ignores all-day events and folded long lines still parse', () => {
    const r = parseIcs(
      ics(`BEGIN:VEVENT
SUMMARY:Holiday
DTSTART;VALUE=DATE:20261001
DTEND;VALUE=DATE:20261002
END:VEVENT
BEGIN:VEVENT
SUMMARY:A very long course
  title
DTSTART:20261001T090000
DTEND:20261001T100000
END:VEVENT
`),
      'UTC',
    );
    expect(r.courses.map((c) => c.name)).toEqual(['A very long course title']);
  });
});
