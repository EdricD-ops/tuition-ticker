import { useEffect, useId, useMemo, useState } from 'react';
import type { TickerConfig } from '../../core';
import { withCurrency } from '../../app/configIO';
import { lang, t } from '../../app/i18n';
import { findRegion } from '../../app/regions';
import { indexSchools, schoolDisplayName, searchSchools, type School, type SchoolList } from '../../app/schools';
import { TextInput } from './fields';

type Index = ReturnType<typeof indexSchools>;

/** The candidate list is ~100 KB of JSON, so it loads the first time the box is used. */
let loading: Promise<Index> | null = null;
function loadSchools(): Promise<Index> {
  loading ??= import('../../../presets/schools.json').then((m) =>
    indexSchools((m.default as SchoolList).schools),
  );
  return loading;
}

function useSchools(enabled: boolean): Index | null {
  const [index, setIndex] = useState<Index | null>(null);
  useEffect(() => {
    if (!enabled || index) return;
    let alive = true;
    void loadSchools().then((i) => alive && setIndex(i));
    return () => {
      alive = false;
    };
  }, [enabled, index]);
  return index;
}

/**
 * "School": a text box that suggests schools from the QS list as the user types (English,
 * Chinese or an abbreviation). Picking one fills the name — local script first, e.g.
 * 香港大學 The University of Hong Kong — plus its region, currency and time zone. Anything
 * not in the list can simply be typed.
 */
export function SchoolField({
  draft,
  onChange,
  error,
  optional = false,
  className = '',
}: {
  draft: TickerConfig;
  onChange: (next: TickerConfig) => void;
  error?: string;
  /** Quick setup: the name only labels the dashboard. */
  optional?: boolean;
  className?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const [active, setActive] = useState(0);
  const index = useSchools(touched);
  const query = draft.schoolName;

  const results = useMemo(() => (index ? searchSchools(index, query, 8) : []), [index, query]);
  const typed = query.trim();
  const showCustom = typed !== '' && !results.some((s) => schoolDisplayName(s) === typed);
  const count = results.length + (showCustom ? 1 : 0);
  const visible = open && typed !== '' && (count > 0 || !index);

  const pick = (school: School) => {
    const region = findRegion(school.country);
    const base = region ? withCurrency(draft, region.currency) : draft;
    onChange({
      ...base,
      schoolName: schoolDisplayName(school),
      ...(region ? { region: region.code, timeZone: school.timeZone } : {}),
    });
    setOpen(false);
  };

  const choose = (i: number) => {
    if (i < results.length) pick(results[i]!);
    else setOpen(false); // "Use what I typed": the text is already the school name.
  };

  const hint = (s: School) => {
    const region = findRegion(s.country);
    const place = region ? (lang === 'zh' ? region.name.zh : region.name.en) : s.country;
    // Chinese readers get the Chinese name when the school has no Chinese-script name.
    const zh = lang === 'zh' && !s.local ? `${s.zh} · ` : '';
    return `${zh}${place}`;
  };

  return (
    <div className={`relative ${className}`}>
      <label htmlFor={`${id}-input`} className="text-[13px] font-medium text-fg-2">
        {t('schoolName')}
        {optional && <span className="font-normal text-muted">{t('optional')}</span>}
      </label>
      <div className="mt-1.5">
        <TextInput
          id={`${id}-input`}
          role="combobox"
          aria-expanded={visible}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={visible && count > 0 ? `${id}-opt-${active}` : undefined}
          autoComplete="off"
          value={query}
          placeholder={t('schoolNamePlaceholder')}
          invalid={!!error}
          onFocus={() => {
            setTouched(true);
            setOpen(true);
          }}
          onBlur={() => setOpen(false)}
          onChange={(e) => {
            onChange({ ...draft, schoolName: e.target.value });
            setTouched(true);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' && count > 0) {
              e.preventDefault();
              setOpen(true);
              setActive((a) => (a + 1) % count);
            } else if (e.key === 'ArrowUp' && count > 0) {
              e.preventDefault();
              setActive((a) => (a - 1 + count) % count);
            } else if (e.key === 'Enter' && visible && count > 0) {
              e.preventDefault();
              choose(active);
            } else if (e.key === 'Escape' && visible) {
              // Close the list only; don't let the dialog close too.
              e.stopPropagation();
              e.nativeEvent.stopImmediatePropagation();
              setOpen(false);
            }
          }}
        />
      </div>
      {error ? (
        <span className="mt-1.5 block text-xs text-red-500">{error}</span>
      ) : (
        <span className="mt-1.5 block text-xs text-muted">{t('schoolNameHint')}</span>
      )}

      {visible && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute inset-x-0 top-[4.4rem] z-20 max-h-80 overflow-y-auto rounded-lg border border-line bg-surface py-1 shadow-xl"
        >
          {!index && <li className="px-3.5 py-2 text-[13px] text-muted">{t('schoolLoading')}</li>}
          {results.map((s, i) => (
            <li
              key={s.id}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              // mousedown, not click: picking must happen before the input loses focus.
              onMouseDown={(e) => {
                e.preventDefault();
                pick(s);
              }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-3.5 py-2 ${i === active ? 'bg-raised' : ''}`}
            >
              <div className="truncate text-[14px] text-fg">{schoolDisplayName(s)}</div>
              <div className="truncate text-xs text-muted">{hint(s)}</div>
            </li>
          ))}
          {showCustom && index && (
            <li
              id={`${id}-opt-${results.length}`}
              role="option"
              aria-selected={active === results.length}
              onMouseDown={(e) => {
                e.preventDefault();
                setOpen(false);
              }}
              onMouseEnter={() => setActive(results.length)}
              className={`cursor-pointer border-t border-line px-3.5 py-2 text-[13px] text-fg-2 ${
                active === results.length ? 'bg-raised' : ''
              }`}
            >
              ＋ {t('schoolUseTyped', { name: typed })}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
