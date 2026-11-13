/**
 * Turns timetables from other tools into courses: iCalendar (.ics) files, CSV/TSV tables
 * (including cells copied out of Excel) and loosely formatted pasted text. Everything runs
 * in the browser; nothing is uploaded.
 */
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';
import {
  addDays,
  isValidPlainTime,
  isValidTimeZone,
  parsePlainDate,
  timeToMinutes,
  weekdayOf,
  type Course,
  type PlainDate,
  type Weekday,
} from '../core';
import { newId } from './configIO';

export const DEFAULT_WEEKS = 13;

export interface ImportResult {
  courses: Course[];
  /** Earliest class date found, if the source has real dates (.ics). */
  termStart?: PlainDate;
}

// ---- Weekdays ----------------------------------------------------------------------------

const EN_DAYS: [RegExp, Weekday][] = [
  [/^mon(day)?$/i, 1],
  [/^tue(s(day)?)?$/i, 2],
  [/^wed(nesday)?$/i, 3],
  [/^thu(r(s(day)?)?)?$/i, 4],
  [/^fri(day)?$/i, 5],
  [/^sat(urday)?$/i, 6],
  [/^sun(day)?$/i, 7],
];
const ZH_DAYS: Record<string, Weekday> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 7, 天: 7 };
const ICS_DAYS: Record<string, Weekday> = { MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6, SU: 7 };

const EN_DAY_RE = /\b(mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday)?|thu(?:r(?:s(?:day)?)?)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b/gi;
const ZH_DAY_RE = /(?:周|星期|礼拜|週|禮拜)([一二三四五六日天])/g;

const sortDays = (days: Iterable<Weekday>) => [...new Set(days)].sort((a, b) => a - b);

/** Weekdays mentioned in free text: "Tue/Thu", "周二、周四", "星期一". */
export function weekdaysInText(text: string): Weekday[] {
  const found: Weekday[] = [];
  for (const m of text.matchAll(EN_DAY_RE)) {
    const d = EN_DAYS.find(([re]) => re.test(m[1]!))?.[1];
    if (d) found.push(d);
  }
  for (const m of text.matchAll(ZH_DAY_RE)) found.push(ZH_DAYS[m[1]!]!);
  return sortDays(found);
}

/** Weekdays in a dedicated table cell, where bare forms are allowed too: "1;3", "二四". */
export function parseWeekdayCell(cell: string): Weekday[] {
  const named = weekdaysInText(cell);
  if (named.length > 0) return named;
  const found: Weekday[] = [];
  for (const ch of cell) {
    if (ch in ZH_DAYS) found.push(ZH_DAYS[ch]!);
    else if (/[1-7]/.test(ch)) found.push(Number(ch) as Weekday);
  }
  return sortDays(found);
}

// ---- Times -------------------------------------------------------------------------------

const TIME_RANGE_RE =
  /(\d{1,2})[:：.](\d{2})\s*(?:-|–|—|~|～|至|到|to)\s*(\d{1,2})[:：.](\d{2})/i;

const pad = (n: number | string) => String(n).padStart(2, '0');

function normTime(t: string): string | null {
  const m = /^\s*(\d{1,2})[:：.](\d{2})/.exec(t);
  if (!m) return null;
  const v = `${pad(m[1]!)}:${m[2]}`;
  return isValidPlainTime(v) ? v : null;
}

function timeRange(text: string): { start: string; end: string } | null {
  const m = TIME_RANGE_RE.exec(text);
  if (!m) return null;
  const start = normTime(`${m[1]}:${m[2]}`);
  const end = normTime(`${m[3]}:${m[4]}`);
  return start && end ? { start, end } : null;
}

// ---- Grouping ----------------------------------------------------------------------------

interface Draft {
  name: string;
  start: string;
  end: string;
  weekdays: Weekday[];
  weeks: number;
}

/** Merges rows of the same course at the same time (e.g. Tue and Thu lines) into one. */
function group(drafts: Draft[]): Course[] {
  const byKey = new Map<string, Draft>();
  for (const d of drafts) {
    if (!d.name || timeToMinutes(d.end) <= timeToMinutes(d.start) || d.weekdays.length === 0) continue;
    const key = `${d.name.toLowerCase()}|${d.start}|${d.end}`;
    const prev = byKey.get(key);
    if (prev) {
      prev.weekdays = sortDays([...prev.weekdays, ...d.weekdays]);
      prev.weeks = Math.max(prev.weeks, d.weeks);
    } else {
      byKey.set(key, { ...d, weekdays: sortDays(d.weekdays) });
    }
  }
  return [...byKey.values()].map((d) => ({ id: newId(), ...d }));
}

// ---- CSV / TSV ---------------------------------------------------------------------------

function splitRow(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === sep && !quoted) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

const HEADERS: Record<keyof Draft, RegExp> = {
  name: /^(course|course name|name|subject|课程|课程名|課程|課程名|科目|名称|名稱)$/i,
  weekdays: /^(weekdays?|days?|星期|星期几|星期幾|周几|週幾|上课日|上課日)$/i,
  start: /^(start|start time|from|开始|开始时间|開始|開始時間)$/i,
  end: /^(end|end time|to|结束|结束时间|結束|結束時間)$/i,
  weeks: /^(weeks|周数|週數)$/i,
};

/** Parses a table with columns course, weekdays, start, end, weeks (header optional). */
export function parseTable(text: string): Course[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return [];
  const sep = lines[0]!.includes('\t') ? '\t' : lines[0]!.includes(';') && !lines[0]!.includes(',') ? ';' : ',';
  const rows = lines.map((l) => splitRow(l, sep));

  const header = rows[0]!;
  const cols: Partial<Record<keyof Draft, number>> = {};
  header.forEach((h, i) => {
    for (const [k, re] of Object.entries(HEADERS) as [keyof Draft, RegExp][]) {
      if (re.test(h.replace(/^﻿/, '').trim()) && cols[k] === undefined) cols[k] = i;
    }
  });
  const hasHeader = cols.name !== undefined;
  const at = (row: string[], k: keyof Draft, fallback: number) => row[cols[k] ?? fallback] ?? '';

  const drafts: Draft[] = [];
  for (const row of hasHeader ? rows.slice(1) : rows) {
    const startCell = at(row, 'start', 2);
    const endCell = at(row, 'end', 3);
    // Accept a single "18:00-22:00" cell in place of separate start and end.
    const range = timeRange(`${startCell} ${endCell}`) ?? timeRange(startCell);
    const start = range?.start ?? normTime(startCell);
    const end = range?.end ?? normTime(endCell);
    if (!start || !end) continue;
    const weeks = parseInt(at(row, 'weeks', 4), 10);
    drafts.push({
      name: at(row, 'name', 0),
      weekdays: parseWeekdayCell(at(row, 'weekdays', 1)),
      start,
      end,
      weeks: Number.isInteger(weeks) && weeks > 0 ? weeks : DEFAULT_WEEKS,
    });
  }
  return group(drafts);
}

// ---- Pasted text -------------------------------------------------------------------------

/**
 * Best-effort parsing of text copied from a timetable page. Each line that contains a time
 * range becomes a class; weekdays come from the same line, or from the most recent line
 * that only names a day (timetables grouped under "Monday" headings).
 */
export function parseText(text: string): Course[] {
  const firstLine = text.trim().split(/\r?\n/)[0] ?? '';
  if (/\t|,/.test(firstLine) && Object.values(HEADERS).some((re) => splitRow(firstLine, firstLine.includes('\t') ? '\t' : ',').some((c) => re.test(c)))) {
    return parseTable(text);
  }

  const drafts: Draft[] = [];
  let headingDays: Weekday[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const range = timeRange(line);
    const days = weekdaysInText(line);
    if (!range) {
      if (days.length > 0) headingDays = days;
      continue;
    }
    const name = line
      .replace(TIME_RANGE_RE, ' ')
      .replace(EN_DAY_RE, ' ')
      .replace(ZH_DAY_RE, ' ')
      .replace(/[|,，、;；\t]+/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim()
      .replace(/^[-–—:：\s]+|[-–—:：\s]+$/g, '');
    drafts.push({
      name,
      start: range.start,
      end: range.end,
      weekdays: days.length > 0 ? days : headingDays,
      weeks: DEFAULT_WEEKS,
    });
  }
  return group(drafts);
}

// ---- iCalendar ---------------------------------------------------------------------------

interface IcsProp {
  value: string;
  params: Record<string, string>;
}

function unfold(text: string): string[] {
  return text.replace(/\r\n/g, '\n').replace(/\n[ \t]/g, '').split('\n');
}

function parseProp(line: string): [string, IcsProp] | null {
  const colon = line.indexOf(':');
  if (colon < 0) return null;
  const [name, ...paramParts] = line.slice(0, colon).split(';');
  const params: Record<string, string> = {};
  for (const p of paramParts) {
    const [k, v] = p.split('=');
    if (k && v) params[k.toUpperCase()] = v.replace(/^"|"$/g, '');
  }
  return [name!.toUpperCase(), { value: line.slice(colon + 1), params }];
}

const unescapeText = (v: string) =>
  v.replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1').trim();

/** Wall-clock date and time of an iCalendar date-time, expressed in the school time zone. */
function icsLocal(prop: IcsProp, schoolTz: string): { date: PlainDate; time: string } | null {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/.exec(prop.value.trim());
  if (!m) return null; // all-day events have no time
  const wall = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}`;
  let instant: Date | null = null;
  if (m[7] === 'Z') instant = new Date(`${wall}Z`);
  else if (prop.params.TZID && isValidTimeZone(prop.params.TZID) && prop.params.TZID !== schoolTz) {
    instant = fromZonedTime(wall, prop.params.TZID);
  }
  if (!instant) return { date: `${m[1]}-${m[2]}-${m[3]}`, time: `${m[4]}:${m[5]}` };
  return {
    date: formatInTimeZone(instant, schoolTz, 'yyyy-MM-dd'),
    time: formatInTimeZone(instant, schoolTz, 'HH:mm'),
  };
}

function untilDate(value: string, schoolTz: string): PlainDate | null {
  const m = /^(\d{4})(\d{2})(\d{2})/.exec(value);
  if (!m) return null;
  if (/T\d{6}Z$/.test(value)) return icsLocal({ value, params: {} }, schoolTz)?.date ?? null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

const daysBetween = (a: PlainDate, b: PlainDate) =>
  Math.round((parsePlainDate(b)! - parsePlainDate(a)!) / 86_400_000);

/**
 * Reads weekly classes from an iCalendar file. Recurring events use their RRULE (BYDAY,
 * COUNT / UNTIL); one-off events are grouped by title and time, and their dates set the
 * number of weeks. Times are converted into the school time zone.
 */
export function parseIcs(text: string, schoolTz: string): ImportResult {
  const lines = unfold(text);
  const groups = new Map<string, { draft: Draft; dates: Set<PlainDate> }>();
  let earliest: PlainDate | undefined;
  let event: Record<string, IcsProp> | null = null;

  const finish = (ev: Record<string, IcsProp>) => {
    if (!ev.DTSTART || !ev.SUMMARY) return;
    const start = icsLocal(ev.DTSTART, schoolTz);
    const end = ev.DTEND ? icsLocal(ev.DTEND, schoolTz) : null;
    if (!start || !end || end.date !== start.date) return;

    const rule = Object.fromEntries(
      (ev.RRULE?.value ?? '').split(';').map((p) => p.split('=') as [string, string]),
    );
    let weekdays: Weekday[] = [weekdayOf(start.date)];
    let weeks = 1;
    if (rule.FREQ === 'WEEKLY') {
      if (rule.BYDAY) {
        const days = rule.BYDAY.split(',')
          .map((d: string) => ICS_DAYS[d.replace(/^[+-]?\d+/, '')])
          .filter((d): d is Weekday => d !== undefined);
        if (days.length > 0) weekdays = sortDays(days);
      }
      if (rule.COUNT) weeks = Math.ceil(Number(rule.COUNT) / weekdays.length);
      else if (rule.UNTIL) {
        const until = untilDate(rule.UNTIL, schoolTz);
        if (until) weeks = Math.floor(daysBetween(start.date, until) / 7) + 1;
      } else weeks = DEFAULT_WEEKS;
    }

    const name = unescapeText(ev.SUMMARY.value);
    const key = `${name.toLowerCase()}|${start.time}|${end.time}`;
    const g = groups.get(key) ?? {
      draft: { name, start: start.time, end: end.time, weekdays: [], weeks: 0 },
      dates: new Set<PlainDate>(),
    };
    g.draft.weekdays = sortDays([...g.draft.weekdays, ...weekdays]);
    if (rule.FREQ === 'WEEKLY') g.draft.weeks = Math.max(g.draft.weeks, weeks);
    g.dates.add(start.date);
    groups.set(key, g);
    if (!earliest || start.date < earliest) earliest = start.date;
  };

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') event = {};
    else if (line === 'END:VEVENT') {
      if (event) finish(event);
      event = null;
    } else if (event) {
      const prop = parseProp(line);
      if (prop && !(prop[0] in event)) event[prop[0]] = prop[1];
    }
  }

  const drafts = [...groups.values()].map(({ draft, dates }) => {
    if (draft.weeks === 0) {
      // One-off events: weeks span from the first to the last date seen.
      const sorted = [...dates].sort();
      draft.weeks = Math.floor(daysBetween(sorted[0]!, sorted[sorted.length - 1]!) / 7) + 1;
    }
    return draft;
  });
  return { courses: group(drafts), ...(earliest ? { termStart: earliest } : {}) };
}

// ---- Template ----------------------------------------------------------------------------

/** A CSV the user can fill in Excel / Numbers / Google Sheets and import back. */
export function csvTemplate(language: 'zh' | 'zh-Hant' | 'en' = 'en'): string {
  const rows = {
    zh: [
      ['课程名', '星期', '开始', '结束', '周数'],
      ['Corporate Finance', '周二;周四', '18:00', '21:00', '13'],
      ['Statistics', '周六', '09:30', '12:30', '13'],
    ],
    'zh-Hant': [
      ['課程名', '星期', '開始', '結束', '週數'],
      ['Corporate Finance', '週二;週四', '18:00', '21:00', '13'],
      ['Statistics', '週六', '09:30', '12:30', '13'],
    ],
    en: [
      ['course', 'weekdays', 'start', 'end', 'weeks'],
      ['Corporate Finance', 'Tue;Thu', '18:00', '21:00', '13'],
      ['Statistics', 'Sat', '09:30', '12:30', '13'],
    ],
  }[language];
  // BOM so Excel opens UTF-8 (Chinese) correctly.
  return `﻿${rows.map((r) => r.join(',')).join('\r\n')}\r\n`;
}

/** Monday of the week containing `date`, a sensible term start for imported timetables. */
export function mondayOf(date: PlainDate): PlainDate {
  return addDays(date, 1 - weekdayOf(date));
}
