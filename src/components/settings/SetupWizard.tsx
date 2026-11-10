import { useMemo, useState } from 'react';
import type { TickerConfig } from '../../core';
import { blankConfig } from '../../app/configIO';
import { coursesStepValid, formErrors, schoolStepValid } from '../../app/formErrors';
import { t } from '../../app/i18n';
import { Button } from '../ui';
import { CoursesSection, CurrencySection, HolidaysSection, SchoolSection } from './sections';
import { useOverlay } from './useOverlay';

const STEPS = ['stepSchool', 'stepCourses', 'stepExtras'] as const;

/** First-run setup: three short steps, then the dashboard switches from demo to real data. */
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

  const stepValid = step === 0 ? schoolStepValid(errors) : step === 1 ? coursesStepValid(errors) : true;
  const next = () => {
    if (!stepValid) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    if (step < STEPS.length - 1) setStep(step + 1);
    else onFinish(draft);
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
            <span className="eyebrow">{t('stepOf', { n: step + 1, total: STEPS.length })}</span>
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
            {t(STEPS[step]!)}
          </h2>
          {step === 0 && <p className="mt-1 text-sm text-muted">{t('setupIntro')}</p>}
          {step === 1 && <p className="mt-1 text-sm text-muted">{t('coursesHint')}</p>}
          {step === 2 && <p className="mt-1 text-sm text-muted">{t('holidaysHint')}</p>}
          <div className="mt-5 grid grid-cols-3 gap-1.5">
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

        <div key={step} className="rise flex-1 overflow-y-auto px-5 py-6 sm:px-8">
          {step === 0 && <SchoolSection {...section} />}
          {step === 1 && <CoursesSection {...section} />}
          {step === 2 && (
            <div className="space-y-8">
              <HolidaysSection draft={draft} onChange={setDraft} />
              <CurrencySection draft={draft} onChange={setDraft} />
            </div>
          )}
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-line px-5 py-3 sm:px-8">
          {step > 0 ? <Button onClick={() => setStep(step - 1)}>{t('back')}</Button> : <span />}
          <Button variant="primary" onClick={next}>
            {step === STEPS.length - 1 ? t('finish') : t('next')}
          </Button>
        </footer>
      </div>
    </div>
  );
}
