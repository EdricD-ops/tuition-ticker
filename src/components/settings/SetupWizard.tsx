import { useMemo, useState } from 'react';
import type { TickerConfig } from '../../core';
import { blankConfig } from '../../app/configIO';
import { coursesStepValid, formErrors, quickValid, schoolStepValid } from '../../app/formErrors';
import { t } from '../../app/i18n';
import { Button } from '../ui';
import { LinkButton } from './fields';
import { SchoolField } from './SchoolField';
import {
  CoursesSection,
  CurrencySection,
  HolidaysSection,
  QuickSection,
  SchoolSection,
  TuitionFields,
} from './sections';
import { useOverlay } from './useOverlay';

const STEPS = ['stepSchool', 'stepCourses', 'stepExtras'] as const;

/**
 * First-run setup. It opens on quick setup (tuition, number of classes, class length: one
 * screen); a link switches to the three-step timetable setup and back.
 */
export function SetupWizard({
  onFinish,
  onClose,
}: {
  onFinish: (config: TickerConfig) => void;
  onClose: () => void;
}) {
  useOverlay(onClose);
  const [draft, setDraft] = useState(blankConfig);
  const [step, setStep] = useState(0);
  const [showErrors, setShowErrors] = useState(false);
  const errors = useMemo(() => formErrors(draft), [draft]);

  const quick = draft.mode === 'quick';
  const setMode = (mode: 'quick' | 'full') => {
    setDraft({ ...draft, mode });
    setStep(0);
    setShowErrors(false);
  };

  const stepValid = quick
    ? quickValid(errors)
    : step === 0
      ? schoolStepValid(errors)
      : step === 1
        ? coursesStepValid(errors)
        : true;
  const last = quick || step === STEPS.length - 1;
  const next = () => {
    if (!stepValid) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    // Quick setup skips the currency step: convert to the default (CNY) unless tuition is in it.
    if (last && quick && !draft.displayCurrency && draft.currency !== 'CNY') {
      onFinish({ ...draft, displayCurrency: 'CNY', fixedRate: null });
    } else if (last) onFinish(draft);
    else setStep(step + 1);
  };

  const section = { draft, onChange: setDraft, errors, showErrors };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm [animation:fade_200ms_ease_both]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="setup-title"
        className="rise relative flex max-h-[100svh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-2xl sm:max-h-[90svh] sm:rounded-2xl"
      >
        <header className="shrink-0 px-5 pt-6 sm:px-8 sm:pt-8">
          <div className="flex items-center justify-between gap-4">
            <span className="eyebrow">
              {quick ? t('modeQuick') : t('stepOf', { n: step + 1, total: STEPS.length })}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label={t('close')}
              className="text-muted transition-colors hover:text-fg"
            >
              ✕
            </button>
          </div>
          <h2 id="setup-title" className="mt-3 font-title text-[clamp(1.75rem,4vw,2.5rem)] leading-[1.1]">
            {quick ? t('quickTitle') : t(STEPS[step]!)}
          </h2>
          {quick && <p className="mt-1 text-sm text-muted">{t('quickIntro')}</p>}
          {!quick && step === 0 && <p className="mt-1 text-sm text-muted">{t('setupIntro')}</p>}
          {!quick && step === 1 && <p className="mt-1 text-sm text-muted">{t('coursesHint')}</p>}
          {!quick && step === 2 && <p className="mt-1 text-sm text-muted">{t('holidaysHint')}</p>}
          <div className={`mt-5 grid grid-cols-3 gap-1.5 ${quick ? 'hidden' : ''}`}>
            {STEPS.map((s, i) => (
              <div key={s} className="h-[3px] overflow-hidden rounded-full bg-track">
                <div
                  className="h-full bg-fg transition-[width] duration-500 ease-[var(--ease-out-expo)]"
                  style={{ width: i <= step ? '100%' : '0%' }}
                />
              </div>
            ))}
          </div>
        </header>

        <div key={quick ? 'quick' : step} className="rise flex-1 overflow-y-auto px-5 py-6 sm:px-8">
          {quick && (
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <TuitionFields {...section} />
              </div>
              <QuickSection {...section} />
              <SchoolField draft={draft} onChange={setDraft} optional />
            </div>
          )}
          {!quick && step === 0 && <SchoolSection {...section} />}
          {!quick && step === 1 && <CoursesSection {...section} />}
          {!quick && step === 2 && (
            <div className="space-y-8">
              <HolidaysSection draft={draft} onChange={setDraft} />
              <CurrencySection draft={draft} onChange={setDraft} />
            </div>
          )}
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-line px-5 py-3 sm:px-8">
          {quick ? (
            <LinkButton onClick={() => setMode('full')} className="text-left">
              {t('quickMore')} →
            </LinkButton>
          ) : step > 0 ? (
            <Button onClick={() => setStep(step - 1)}>{t('back')}</Button>
          ) : (
            <LinkButton onClick={() => setMode('quick')}>← {t('backToQuick')}</LinkButton>
          )}
          <Button variant="primary" onClick={next} className="shrink-0">
            {last ? t('finish') : t('next')}
          </Button>
        </footer>
      </div>
    </div>
  );
}
