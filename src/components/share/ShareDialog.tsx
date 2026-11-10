import { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { track } from '../../app/analytics';
import { schoolLabel, type Snapshot, type TickerConfig } from '../../core';
import { t } from '../../app/i18n';
import { shareUrl } from '../../app/shareLink';
import { useOverlay } from '../settings/useOverlay';
import { Button } from '../ui';
import { CARD_SIZE, ShareCard, type CardRatio } from './ShareCard';

/** Width the card preview is drawn at inside the dialog, in CSS pixels. */
const PREVIEW_WIDTH = 270;

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-line p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={`h-7 rounded px-3 text-[13px] transition-colors ${
            o.value === value ? 'bg-raised text-fg' : 'text-muted hover:text-fg'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function ShareDialog({
  snap,
  config,
  isDemo,
  quip,
  date,
  defaultHideAmounts,
  onClose,
}: {
  snap: Snapshot;
  config: TickerConfig;
  isDemo: boolean;
  quip: string;
  /** Printed on the card, e.g. 2026-11-10. */
  date: string;
  /** Starts ticked when any privacy level is on. */
  defaultHideAmounts: boolean;
  onClose: () => void;
}) {
  useOverlay(onClose);
  const [ratio, setRatio] = useState<CardRatio>('post');
  const [hideAmounts, setHideAmounts] = useState(defaultHideAmounts);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);
  const card = useRef<HTMLDivElement>(null);

  // The demo is not anyone's setup, so it has no link to share.
  useEffect(() => {
    if (isDemo) return;
    let alive = true;
    void shareUrl(config, location.href).then((url) => alive && setLink(url));
    return () => {
      alive = false;
    };
  }, [config, isDemo]);

  const download = async () => {
    if (!card.current) return;
    setBusy(true);
    setError(false);
    try {
      const { width, height } = CARD_SIZE[ratio];
      const dataUrl = await toPng(card.current, {
        width,
        height,
        pixelRatio: 1,
        cacheBust: true,
        preferredFontFormat: 'woff2',
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `tuition-ticker-${ratio === 'post' ? '3x4' : '9x16'}.png`;
      a.click();
      track(ratio === 'post' ? 'share-png-3x4' : 'share-png-9x16');
    } catch (err) {
      console.warn('Share card export failed:', err);
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      track('share-link-copy');
    } catch {
      // Clipboard blocked: select the text so the user can copy it by hand.
      document.getElementById('share-link')?.focus();
      (document.getElementById('share-link') as HTMLInputElement | null)?.select();
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const { width, height } = CARD_SIZE[ratio];
  const scale = PREVIEW_WIDTH / width;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm [animation:fade_200ms_ease_both]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        className="rise relative flex max-h-[100svh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-line bg-surface shadow-2xl sm:max-h-[92svh] sm:rounded-2xl"
      >
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5 sm:px-8">
          <h2 id="share-title" className="font-title text-[26px] leading-none">
            {t('shareTitle')}
          </h2>
          <Button onClick={onClose}>{t('close')}</Button>
        </header>

        <div className="flex-1 overflow-y-auto">
          <section className="grid gap-6 px-5 py-6 sm:grid-cols-[auto_1fr] sm:gap-8 sm:px-8">
            {/* Scaled-down live preview of the exact node that gets exported. */}
            <div
              className="mx-auto overflow-hidden rounded-lg border border-line"
              style={{ width: PREVIEW_WIDTH, height: height * scale }}
            >
              <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width, height }}>
                <ShareCard
                  ref={card}
                  snap={snap}
                  currency={config.currency}
                  schoolName={schoolLabel(config)}
                  quip={quip}
                  ratio={ratio}
                  hideAmounts={hideAmounts}
                  date={date}
                />
              </div>
            </div>

            <div className="min-w-0">
              <h3 className="font-title text-2xl leading-tight">{t('shareCardTitle')}</h3>
              <div className="mt-4">
                <Segmented
                  value={ratio}
                  onChange={setRatio}
                  options={[
                    { value: 'post', label: t('ratioPost') },
                    { value: 'story', label: t('ratioStory') },
                  ]}
                />
              </div>
              <label className="mt-5 flex cursor-pointer items-start gap-2.5">
                <input
                  type="checkbox"
                  checked={hideAmounts}
                  onChange={(e) => setHideAmounts(e.target.checked)}
                  className="mt-0.5 size-4 accent-[var(--fg)]"
                />
                <span>
                  <span className="block text-sm text-fg">{t('hideAmounts')}</span>
                  <span className="block text-xs text-muted">{t('hideAmountsHint')}</span>
                </span>
              </label>
              <div className="mt-6 flex items-center gap-3">
                <Button variant="primary" onClick={() => void download()} disabled={busy}>
                  {busy ? t('exporting') : t('downloadPng')}
                </Button>
                <span className="num font-mono text-xs text-muted">
                  {width} × {height}
                </span>
              </div>
              {error && <p className="mt-2 text-xs text-red-500">{t('exportFailed')}</p>}

              <div className="mt-8 border-t border-line pt-6">
                <h3 className="font-title text-2xl leading-tight">{t('shareLinkTitle')}</h3>
                {isDemo ? (
                  <p className="mt-2 text-[13px] text-muted">{t('shareLinkDemo')}</p>
                ) : (
                  <>
                    <p className="mt-2 text-[13px] text-muted">{t('shareLinkHint')}</p>
                    <div className="mt-3 flex gap-2">
                      <input
                        id="share-link"
                        readOnly
                        value={link}
                        onFocus={(e) => e.target.select()}
                        className="h-8 min-w-0 flex-1 rounded-md border border-line bg-bg px-2.5 font-mono text-xs text-fg-2 outline-none"
                      />
                      <Button onClick={() => void copy()} disabled={!link}>
                        {copied ? t('copied') : t('copyLink')}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
