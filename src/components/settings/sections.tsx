import { useCallback, useMemo, useState } from 'react';
import {
  createPlan,
  resolveConversion,
  dateInTimeZone,
  formatMoney,
  localize,
  type Course,
  type Holiday,
  type TickerConfig,
  type Weekday,
} from '../../core';
import { newId, withCurrency } from '../../app/configIO';
import type { FormErrors } from '../../app/formErrors';
import { publicHolidaysFor } from '../../app/holidayData';
import { lang, locale, t } from '../../app/i18n';
import { CURRENCIES, REGIONS, allTimeZones, findRegion } from '../../app/regions';
import { useRates } from '../../app/useRates';
import { formatRate } from '../Fx';
import { Button } from '../ui';
import { Field, LinkButton, NumberInput, SectionTitle, Select, TextInput } from './fields';
import { SchoolField } from './SchoolField';
import { ImportDialog, dayLabel } from './ImportDialog';

export interface SectionProps {
  draft: TickerConfig;
  onChange: (next: TickerConfig) => void;
  errors: FormErrors;
  /** Errors appear only after the user tries to continue or save. */
  showErrors: boolean;
}

const msg = (key: Parameters<typeof t>[0] | undefined, show: boolean) =>
  show && key ? t(key) : undefined;

export function SchoolSection({ draft, onChange, errors, showErrors }: SectionProps) {
  const region = findRegion(draft.region);
  const zones = useMemo(() => {
    const list = region && region.code !== 'OTHER' ? region.timeZones : allTimeZones();
    return list.includes(draft.timeZone) ? list : [draft.timeZone, ...list];
  }, [region, draft.timeZone]);

  const setRegion = (code: string) => {
    const r = findRegion(code);
    if (!r) return;
    // A new region brings its default currency and time zone; both stay editable.
    onChange({ ...withCurrency(draft, r.currency), region: r.code, timeZone: r.timeZones[0]! });
  };

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <SchoolField
        draft={draft}
        onChange={onChange}
        error={msg(errors.schoolName, showErrors)}
        className="sm:col-span-2"
      />
      <Field label={t('programme')} className="sm:col-span-2">
        <TextInput
          value={draft.programme}
          placeholder={t('programmePlaceholder')}
          onChange={(e) => onChange({ ...draft, programme: e.target.value })}
        />
      </Field>
      <Field label={t('region')}>
        <Select value={draft.region} onChange={(e) => setRegion(e.target.value)}>
          {REGIONS.map((r) => (
            <option key={r.code} value={r.code}>
              {lang === 'zh' ? r.name.zh : r.name.en}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t('timeZone')}>
        <Select value={draft.timeZone} onChange={(e) => onChange({ ...draft, timeZone: e.target.value })}>
          {zones.map((z) => (
            <option key={z} value={z}>
              {z.replace(/_/g, ' ')}
            </option>
          ))}
        </Select>
      </Field>
      <Field label={t('currency')}>
        <Select value={draft.currency} onChange={(e) => onChange(withCurrency(draft, e.target.value))}>
          {(CURRENCIES.includes(draft.currency) ? CURRENCIES : [draft.currency, ...CURRENCIES]).map(
            (c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ),
          )}
        </Select>
      </Field>
      <Field label={t('tuition')} error={msg(errors.tuition, showErrors)} hint={t('tuitionHint')}>
        <NumberInput
          value={draft.tuition}
          min={0}
          step="any"
          placeholder="420000"
          invalid={showErrors && !!errors.tuition}
          onValue={(n) => onChange({ ...draft, tuition: Math.max(0, n) })}
        />
      </Field>
      <p className="-mt-2 text-xs text-muted sm:col-span-2">{t('timeZoneHint')}</p>
    </div>
  );
}

const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7];

function DayChips({
  value,
  onChange,
  invalid,
}: {
  value: Weekday[];
  onChange: (days: Weekday[]) => void;
  invalid?: boolean;
}) {
  const set = new Set(value);
  return (
    <div
      role="group"
      aria-label={t('classDays')}
      className={`flex gap-1 rounded-md border p-1 ${invalid ? 'border-red-500/70' : 'border-line'}`}
    >
      {WEEKDAYS.map((d) => {
        const on = set.has(d);
        return (
          <button
            key={d}
            type="button"
            aria-pressed={on}
            onClick={() =>
              onChange(on ? value.filter((x) => x !== d) : [...value, d].sort((a, b) => a - b))
            }
            className={`h-8 min-w-0 flex-1 rounded text-[13px] transition-colors duration-150 ${
              on ? 'bg-fg font-medium text-bg' : 'text-fg-2 hover:bg-raised'
            }`}
          >
            {dayLabel(d)}
          </button>
        );
      })}
    </div>
  );
}

export function CoursesSection({ draft, onChange, errors, showErrors }: SectionProps) {
  const plan = useMemo(() => createPlan(draft, publicHolidaysFor(draft.region)), [draft]);
  const [importing, setImporting] = useState(false);
  const closeImport = useCallback(() => setImporting(false), []);
  const update = (id: string, patch: Partial<Course>) =>
    onChange({ ...draft, courses: draft.courses.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  const remove = (id: string) =>
    onChange({ ...draft, courses: draft.courses.filter((c) => c.id !== id) });
  const add = () => {
    const last = draft.courses[draft.courses.length - 1];
    onChange({
      ...draft,
      courses: [
        ...draft.courses,
        {
          id: newId(),
          name: '',
          start: last?.start ?? '09:00',
          end: last?.end ?? '12:00',
          weekdays: [],
          weeks: last?.weeks ?? 13,
        },
      ],
    });
  };
  const isBlank = (c: Course) => !c.name.trim() && c.weekdays.length === 0;

  return (
    <div>
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto]">
        <Field label={t('termStart')} hint={t('termStartHint')} error={msg(errors.termStart, showErrors)}>
          <TextInput
            type="date"
            value={draft.termStart}
            invalid={showErrors && !!errors.termStart}
            onChange={(e) => onChange({ ...draft, termStart: e.target.value })}
          />
        </Field>
        <div className="sm:mb-[22px]">
          <Button onClick={() => setImporting(true)}>{t('importTimetable')}</Button>
        </div>
      </div>

      <ul className="mt-5 space-y-3">
        {draft.courses.map((c, i) => {
          const e = errors.byCourse[c.id] ?? {};
          return (
            <li key={c.id} className="rounded-xl border border-line bg-bg/50 p-4">
              <div className="flex items-center justify-between">
                <span className="eyebrow">#{i + 1}</span>
                {draft.courses.length > 1 && (
                  <LinkButton tone="danger" onClick={() => remove(c.id)}>
                    {t('removeCourse')}
                  </LinkButton>
                )}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-6">
                <Field
                  label={t('courseName')}
                  error={msg(e.name, showErrors)}
                  className="col-span-2 sm:col-span-6"
                >
                  <TextInput
                    value={c.name}
                    placeholder={t('courseNamePlaceholder')}
                    invalid={showErrors && !!e.name}
                    onChange={(ev) => update(c.id, { name: ev.target.value })}
                  />
                </Field>
                <Field
                  label={t('classDays')}
                  error={msg(e.days, showErrors)}
                  className="col-span-2 sm:col-span-6"
                >
                  <DayChips
                    value={c.weekdays}
                    invalid={showErrors && !!e.days}
                    onChange={(weekdays) => update(c.id, { weekdays })}
                  />
                </Field>
                <Field label={t('startTime')} className="sm:col-span-2">
                  <TextInput
                    type="time"
                    value={c.start}
                    invalid={showErrors && !!e.time}
                    onChange={(ev) => update(c.id, { start: ev.target.value })}
                  />
                </Field>
                <Field label={t('endTime')} className="sm:col-span-2">
                  <TextInput
                    type="time"
                    value={c.end}
                    invalid={showErrors && !!e.time}
                    onChange={(ev) => update(c.id, { end: ev.target.value })}
                  />
                </Field>
                <Field label={t('weeks')} className="col-span-2">
                  <NumberInput
                    value={c.weeks}
                    min={1}
                    step={1}
                    invalid={showErrors && !!e.count}
                    onValue={(n) => update(c.id, { weeks: n })}
                  />
                </Field>
              </div>
              {showErrors && (e.time || e.count) && (
                <p className="mt-2 text-xs text-red-500">{t((e.time ?? e.count)!)}</p>
              )}
            </li>
          );
        })}
      </ul>
      {showErrors && errors.courses && <p className="mt-3 text-xs text-red-500">{t(errors.courses)}</p>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Button onClick={add}>+ {t('addCourse')}</Button>
        {plan.totalSeconds > 0 && (
          <span className="num font-mono text-xs text-muted">
            {t('totalHours', {
              hours: Math.round((plan.totalSeconds / 3600) * 10) / 10,
              classes: plan.totalSessions,
            })}
            {plan.skippedForHolidays > 0 && t('skippedHolidays', { n: plan.skippedForHolidays })}
            {plan.costPerSecond > 0 &&
              ` · ${t('ratePreview', { rate: formatMoney(plan.costPerSecond, draft.currency, 'rate', locale) })}`}
          </span>
        )}
      </div>

      {importing && (
        <ImportDialog
          timeZone={draft.timeZone}
          onClose={closeImport}
          onImport={(courses, mode, termStart) => {
            const kept = mode === 'append' ? draft.courses.filter((c) => !isBlank(c)) : [];
            onChange({
              ...draft,
              courses: [...kept, ...courses],
              ...(termStart ? { termStart } : {}),
            });
            setImporting(false);
          }}
        />
      )}
    </div>
  );
}

export function HolidaysSection({ draft, onChange }: Pick<SectionProps, 'draft' | 'onChange'>) {
  const region = findRegion(draft.region);
  const today = dateInTimeZone(Date.now(), draft.timeZone);
  const [showPast, setShowPast] = useState(false);
  const all = publicHolidaysFor(draft.region);
  const list = showPast ? all : all.filter((h) => (h.end ?? h.date) >= today);
  const hidden = new Set(draft.hiddenHolidays);

  const toggle = (date: string) =>
    onChange({
      ...draft,
      hiddenHolidays: hidden.has(date)
        ? draft.hiddenHolidays.filter((d) => d !== date)
        : [...draft.hiddenHolidays, date],
    });

  const [form, setForm] = useState({ date: '', end: '', name: '' });
  const rangeBad = form.end !== '' && form.date !== '' && form.end < form.date;
  const add = () => {
    if (!form.date || rangeBad) return;
    const h: Holiday = {
      date: form.date,
      ...(form.end && form.end > form.date ? { end: form.end } : {}),
      name: form.name.trim(),
    };
    onChange({
      ...draft,
      customHolidays: [...draft.customHolidays, h].sort((a, b) => a.date.localeCompare(b.date)),
    });
    setForm({ date: '', end: '', name: '' });
  };
  const removeCustom = (i: number) =>
    onChange({ ...draft, customHolidays: draft.customHolidays.filter((_, j) => j !== i) });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[13px] font-medium text-fg-2">
            {t('publicHolidays', { region: region ? localize(region.name, lang) : draft.region })}
          </span>
          {all.length > 0 && (
            <LinkButton onClick={() => setShowPast((v) => !v)}>
              {showPast ? t('hidePast') : t('showPast')}
            </LinkButton>
          )}
        </div>
        {all.length === 0 ? (
          <p className="mt-2 text-[13px] text-muted">{t('noPublicHolidays')}</p>
        ) : (
          <ul className="mt-2 max-h-56 divide-y divide-line overflow-y-auto rounded-xl border border-line">
            {list.map((h) => (
              <li key={h.date} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="num w-24 shrink-0 font-mono text-xs text-muted">{h.date}</span>
                <span className={`min-w-0 flex-1 truncate ${hidden.has(h.date) ? 'text-muted line-through' : ''}`}>
                  {localize(h.name, lang)}
                </span>
                <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-fg-2">
                  <input
                    type="checkbox"
                    className="accent-[var(--fg)]"
                    checked={!hidden.has(h.date)}
                    onChange={() => toggle(h.date)}
                  />
                  {t('remind')}
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <span className="text-[13px] font-medium text-fg-2">{t('schoolHolidays')}</span>
        {draft.customHolidays.length > 0 && (
          <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
            {draft.customHolidays.map((h, i) => (
              <li key={`${h.date}-${i}`} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="num shrink-0 font-mono text-xs text-muted">
                  {h.date}
                  {h.end ? ` – ${h.end}` : ''}
                </span>
                <span className="min-w-0 flex-1 truncate">{localize(h.name, lang)}</span>
                <LinkButton tone="danger" onClick={() => removeCustom(i)}>
                  {t('removeCourse')}
                </LinkButton>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-3 grid grid-cols-2 items-end gap-3 sm:grid-cols-[1fr_1fr_1.4fr_auto]">
          <Field label={t('holidayStart')}>
            <TextInput type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label={t('holidayEnd')}>
            <TextInput
              type="date"
              value={form.end}
              min={form.date || undefined}
              invalid={rangeBad}
              onChange={(e) => setForm({ ...form, end: e.target.value })}
            />
          </Field>
          <Field label={t('holidayName')} className="col-span-2 sm:col-span-1">
            <TextInput
              value={form.name}
              placeholder={t('holidayNamePlaceholder')}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <div className="col-span-2 sm:col-span-1">
            <Button onClick={add} disabled={!form.date || rangeBad}>
              + {t('addHoliday')}
            </Button>
          </div>
        </div>
        {rangeBad && <p className="mt-2 text-xs text-red-500">{t('errHolidayRange')}</p>}
      </div>
    </div>
  );
}

export function CurrencySection({ draft, onChange }: Pick<SectionProps, 'draft' | 'onChange'>) {
  const options = CURRENCIES.filter((c) => c !== draft.currency);
  const to = draft.displayCurrency && draft.displayCurrency !== draft.currency ? draft.displayCurrency : null;
  // Show today's reference rate as a guide next to the fixed-rate box.
  const { table } = useRates(to ? draft.currency : null);
  const reference = to ? resolveConversion({ from: draft.currency, to, fixedRate: null, table, tableIsCurrent: true }) : null;
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label={t('displayCurrency')} hint={t('displayCurrencyHint')}>
        <Select
          value={draft.displayCurrency ?? ''}
          onChange={(e) => onChange({ ...draft, displayCurrency: e.target.value || null, fixedRate: null })}
        >
          <option value="">{t('displayCurrencyOff')}</option>
          {options.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Field>
      {to && (
        <Field
          label={t('fixedRate')}
          hint={
            reference
              ? `${t('fixedRateHint')} ${t('fixedRateCurrent', {
                  from: draft.currency,
                  to,
                  rate: formatRate(reference.rate),
                  date: reference.asOf ?? '',
                })}`
              : t('fixedRateHint')
          }
        >
          <div className="flex items-center gap-2">
            <span className="num shrink-0 font-mono text-sm text-fg-2">1 {draft.currency} =</span>
            <NumberInput
              value={draft.fixedRate ?? 0}
              min={0}
              step="any"
              placeholder={reference ? formatRate(reference.rate) : ''}
              onValue={(n) => onChange({ ...draft, fixedRate: n > 0 ? n : null })}
            />
            <span className="num shrink-0 font-mono text-sm text-fg-2">{to}</span>
          </div>
        </Field>
      )}
    </div>
  );
}

export { SectionTitle };
