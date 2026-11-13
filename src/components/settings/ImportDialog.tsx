import { useRef, useState } from 'react';
import type { Course, PlainDate, Weekday } from '../../core';
import { hant, lang, t } from '../../app/i18n';
import {
  csvTemplate,
  mondayOf,
  parseIcs,
  parseTable,
  parseText,
  type ImportResult,
} from '../../app/timetableImport';
import { Button } from '../ui';
import { useOverlay } from './useOverlay';

type Tab = 'ics' | 'csv' | 'text';

export const dayLabel = (d: Weekday) => t(`wd${d}` as Parameters<typeof t>[0]);
/** "周二、周四" ("週二、週四") or "Tue, Thu". */
export const daysLabel = (days: Weekday[]) =>
  lang === 'zh' ? days.map((d) => `${hant ? '週' : '周'}${dayLabel(d)}`).join('、') : days.map(dayLabel).join(', ');

function saveTemplate() {
  const language = lang === 'en' ? 'en' : hant ? 'zh-Hant' : 'zh';
  const blob = new Blob([csvTemplate(language)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tuition-ticker-timetable.csv';
  a.click();
  URL.revokeObjectURL(url);
}

/** Reads courses from .ics, CSV or pasted text and hands them back for review. */
export function ImportDialog({
  timeZone,
  onImport,
  onClose,
}: {
  timeZone: string;
  onImport: (courses: Course[], mode: 'replace' | 'append', termStart?: PlainDate) => void;
  onClose: () => void;
}) {
  useOverlay(onClose);
  const [tab, setTab] = useState<Tab>('ics');
  const [text, setText] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [useStart, setUseStart] = useState(true);
  const fileInput = useRef<HTMLInputElement>(null);

  const readFile = async (file: File) => {
    const content = await file.text();
    setResult(tab === 'ics' ? parseIcs(content, timeZone) : { courses: parseTable(content) });
  };

  const suggestedStart = result?.termStart ? mondayOf(result.termStart) : undefined;
  const finish = (mode: 'replace' | 'append') => {
    if (!result || result.courses.length === 0) return;
    onImport(result.courses, mode, useStart ? suggestedStart : undefined);
  };

  const tabs: [Tab, string][] = [
    ['ics', t('importTabIcs')],
    ['csv', t('importTabCsv')],
    ['text', t('importTabText')],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm [animation:fade_200ms_ease_both]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-title"
        className="rise relative flex max-h-[100svh] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-2xl sm:max-h-[85svh] sm:rounded-2xl"
      >
        <header className="shrink-0 px-5 pt-6 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <h2 id="import-title" className="font-title text-3xl leading-tight">
              {t('importTitle')}
            </h2>
            <button type="button" onClick={onClose} aria-label={t('close')} className="text-muted hover:text-fg">
              ✕
            </button>
          </div>
          <p className="mt-1 text-sm text-muted">{t('importIntro')}</p>
          <div className="mt-5 flex gap-1 rounded-lg border border-line bg-bg p-1" role="tablist">
            {tabs.map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => {
                  setTab(id);
                  setResult(null);
                }}
                className={`flex-1 rounded-md px-2 py-1.5 text-[13px] transition-colors ${
                  tab === id ? 'bg-surface font-medium text-fg shadow-sm' : 'text-muted hover:text-fg'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          <p className="text-[13px] text-fg-2">
            {tab === 'ics' ? t('importIcsHint') : tab === 'csv' ? t('importCsvHint') : t('importTextHint')}
          </p>

          {tab === 'text' ? (
            <div className="mt-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                placeholder={'FINA6001 Corporate Finance  周二 18:00-22:00\nMKTG6010 Marketing  Sat 14:00-17:00'}
                className="w-full rounded-md border border-line bg-bg px-3 py-2 font-mono text-[13px] outline-none placeholder:text-muted/60 focus:border-fg/40"
              />
              <div className="mt-2">
                <Button onClick={() => setResult({ courses: parseText(text) })} disabled={!text.trim()}>
                  {t('readText')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={() => fileInput.current?.click()}>{t('chooseFile')}</Button>
              {tab === 'csv' && <Button onClick={saveTemplate}>{t('downloadTemplate')}</Button>}
              <input
                ref={fileInput}
                type="file"
                className="hidden"
                accept={tab === 'ics' ? '.ics,text/calendar' : '.csv,.tsv,.txt,text/csv'}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void readFile(f);
                  e.target.value = '';
                }}
              />
            </div>
          )}

          {result && (
            <div className="rise mt-5">
              {result.courses.length === 0 ? (
                <p className="text-[13px] text-red-500">{t('importNone')}</p>
              ) : (
                <>
                  <div className="eyebrow">{t('importFound', { n: result.courses.length })}</div>
                  <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
                    {result.courses.map((c) => (
                      <li key={c.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                        <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
                        <span className="num shrink-0 font-mono text-xs text-muted">
                          {daysLabel(c.weekdays)} {c.start}–{c.end} · {t('weeksCount', { n: c.weeks })}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {suggestedStart && (
                    <label className="mt-3 flex cursor-pointer items-center gap-2 text-[13px] text-fg-2">
                      <input
                        type="checkbox"
                        className="accent-[var(--fg)]"
                        checked={useStart}
                        onChange={(e) => setUseStart(e.target.checked)}
                      />
                      {t('importTermStart', { date: suggestedStart })}
                    </label>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3 sm:px-7">
          <Button onClick={() => finish('append')} disabled={!result?.courses.length}>
            {t('appendCourses')}
          </Button>
          <Button variant="primary" onClick={() => finish('replace')} disabled={!result?.courses.length}>
            {t('replaceCourses')}
          </Button>
        </footer>
      </div>
    </div>
  );
}
