import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { TickerConfig } from '../../core';
import { parseConfig, toExportFile } from '../../app/configIO';
import { formErrors, isFormValid } from '../../app/formErrors';
import { t } from '../../app/i18n';
import { Button } from '../ui';
import { SectionTitle } from './fields';
import { useOverlay } from './useOverlay';
import {
  CoursesSection,
  CurrencySection,
  HolidaysSection,
  ModeSwitch,
  QuickSection,
  SchoolSection,
} from './sections';

function download(config: TickerConfig) {
  const blob = new Blob([JSON.stringify(toExportFile(config), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tuition-ticker-config.json';
  a.click();
  URL.revokeObjectURL(url);
}

function Block({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="border-t border-line px-5 py-7 first:border-t-0 sm:px-8">
      <SectionTitle title={title} hint={hint} />
      {children}
    </section>
  );
}

/** Right-hand sheet with every setting, opened from the header. */
export function SettingsDrawer({
  config,
  banner,
  flagErrors = false,
  onSave,
  onClose,
  onReset,
}: {
  config: TickerConfig;
  /** A note shown above the form, e.g. when the config came from a share link. */
  banner?: string;
  /** Show every gap straight away (configs from elsewhere may be incomplete). */
  flagErrors?: boolean;
  onSave: (config: TickerConfig) => void;
  onClose: () => void;
  /** Clears the saved config and returns to the demo; absent when nothing is saved yet. */
  onReset?: () => void;
}) {
  useOverlay(onClose);
  const [draft, setDraft] = useState(config);
  const [showErrors, setShowErrors] = useState(flagErrors);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const errors = useMemo(() => formErrors(draft), [draft]);
  const fileInput = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const resetBox = useRef<HTMLDivElement>(null);
  // The warning opens at the bottom of the form; bring its buttons into view.
  useEffect(() => {
    if (confirmReset) resetBox.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [confirmReset]);

  const save = () => {
    if (!isFormValid(errors)) {
      setShowErrors(true);
      return;
    }
    onSave(draft);
  };

  const importFile = async (file: File) => {
    try {
      const parsed = parseConfig(JSON.parse(await file.text()));
      if (!parsed) throw new Error('not a config');
      setDraft(parsed);
      setShowErrors(true);
      setNotice({ ok: true, text: t('importDone') });
    } catch {
      setNotice({ ok: false, text: t('importFailed') });
    }
  };

  const section = { draft, onChange: setDraft, errors, showErrors };
  const quick = draft.mode === 'quick';

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] [animation:fade_200ms_ease_both]" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t('settings')}
        className="relative flex h-full w-full max-w-2xl flex-col border-l border-line bg-surface shadow-2xl [animation:slide-in_380ms_var(--ease-out-expo)_both]"
      >
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5 sm:px-8">
          <h2 className="font-title text-[26px] leading-none">{t('settings')}</h2>
          <Button onClick={onClose}>{t('close')}</Button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {banner && (
            <p className="mx-5 mt-5 rounded-md border border-line bg-bg px-3.5 py-2.5 text-[13px] text-fg-2 sm:mx-8">
              {banner}
            </p>
          )}
          <Block title={t('modeTitle')}>
            <ModeSwitch mode={draft.mode ?? 'full'} onChange={(mode) => setDraft({ ...draft, mode })} />
          </Block>
          <Block title={t('stepSchool')}>
            <SchoolSection {...section} />
          </Block>
          {quick ? (
            <Block title={t('coursesTitle')}>
              <QuickSection {...section} />
            </Block>
          ) : (
            <>
              <Block title={t('coursesTitle')} hint={t('coursesHint')}>
                <CoursesSection {...section} />
              </Block>
              <Block title={t('holidaysTitle')} hint={t('holidaysHint')}>
                <HolidaysSection draft={draft} onChange={setDraft} />
              </Block>
            </>
          )}
          <Block title={t('fxTitle')}>
            <CurrencySection draft={draft} onChange={setDraft} />
          </Block>
          <Block title={t('dataTitle')}>
            <p className="mb-4 text-[13px] leading-relaxed text-muted">{t('dataPrivacy')}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => download(draft)}>{t('exportJson')}</Button>
              <Button onClick={() => fileInput.current?.click()}>{t('importJson')}</Button>
              <input
                ref={fileInput}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void importFile(f);
                  e.target.value = '';
                }}
              />
              {notice && (
                <span className={`text-[13px] ${notice.ok ? 'text-live' : 'text-red-500'}`}>{notice.text}</span>
              )}
            </div>
            {onReset &&
              (confirmReset ? (
                <div
                  role="alert"
                  ref={resetBox}
                  className="mt-5 rounded-md border border-red-500/40 bg-bg px-4 py-3.5">
                  <p className="text-[13px] leading-relaxed text-fg-2">{t('resetBody')}</p>
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    <Button onClick={() => setConfirmReset(false)}>{t('cancel')}</Button>
                    <Button onClick={onReset} className="border-red-500/50! text-red-500! hover:bg-red-500/10!">
                      {t('resetConfirm')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-5">
                  <Button onClick={() => setConfirmReset(true)} className="hover:text-red-500!">
                    {t('resetData')}
                  </Button>
                </div>
              ))}
          </Block>
        </div>

        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-line px-5 py-3 sm:px-8">
          <Button onClick={onClose}>{t('cancel')}</Button>
          <Button variant="primary" onClick={save}>
            {t('save')}
          </Button>
        </footer>
      </aside>
    </div>
  );
}
