import { forwardRef, type ReactNode } from 'react';
import type { Snapshot } from '../../core';
import { SITE_LABEL } from '../../app/site';
import { t } from '../../app/i18n';
import { Approx } from '../Fx';
import { LogoMark } from '../LogoMark';
import { Money } from '../Money';
import { PrivacyProvider } from '../Privacy';
import { pct } from '../ui';

export type CardRatio = 'post' | 'story';

/** Export size in pixels: 1080 wide, the width social apps display at full quality. */
export const CARD_SIZE: Record<CardRatio, { width: number; height: number }> = {
  post: { width: 1080, height: 1440 },
  story: { width: 1080, height: 1920 },
};

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <div className="font-mono text-[22px] tracking-[0.14em] text-muted uppercase">{label}</div>
      <div className="num mt-2 truncate text-[46px] leading-tight font-light tracking-[-0.02em]">{children}</div>
    </div>
  );
}

/**
 * The image people post: a fixed-size layout (not a screenshot of the page) so it looks the
 * same on every device. With `hideAmounts`, only the cost per second and percentages remain.
 */
export const ShareCard = forwardRef<
  HTMLDivElement,
  {
    snap: Snapshot;
    currency: string;
    schoolName: string;
    quip: string;
    ratio: CardRatio;
    hideAmounts: boolean;
    date: string;
  }
>(function ShareCard({ snap, currency, schoolName, quip, ratio, hideAmounts, date }, ref) {
  const { width, height } = CARD_SIZE[ratio];
  const live = snap.status === 'in-class' && snap.current;
  const current = snap.current;
  const { totals } = snap;
  const story = ratio === 'story';

  // The label names what the big figure is: with amounts hidden it is the cost per second.
  const eyebrow = hideAmounts
    ? live
      ? `${t('cardPerSecond')} · ${current!.courseName}`
      : t('cardPerSecond')
    : live
      ? `${t('onClass')} · ${current!.courseName}`
      : t('spentSoFar');

  const heroAmount = hideAmounts ? snap.costPerSecond : live ? current!.spent : totals.spent;
  const heroKind = hideAmounts ? 'rate' : live ? 'live' : 'total';

  const stats: { label: string; value: ReactNode }[] = [];
  if (!hideAmounts) {
    stats.push({
      label: t('cardPerSecond'),
      value: <Money amount={snap.costPerSecond} currency={currency} kind="rate" symbolClassName="text-muted" />,
    });
  }
  if (live) stats.push({ label: t('cardClassProgress'), value: pct(current!.progress) });
  stats.push({ label: t('cardTuitionUsed'), value: pct(totals.progress) });
  if (stats.length < 3) {
    stats.push({ label: t('cardClassesLeft'), value: t('classesCount', { n: totals.sessionsRemaining }) });
  }

  return (
    // Amounts here follow the card's own option, not the page's privacy toggle.
    <PrivacyProvider level={0}>
      <div
        ref={ref}
        style={{ width, height }}
        className={`flex flex-col bg-bg text-fg ${story ? 'px-[92px] pt-[150px] pb-[130px]' : 'px-[88px] py-[84px]'}`}
      >
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <LogoMark className="size-[64px] shrink-0 text-fg" />
            <span className="font-title text-[56px] leading-none tracking-[-0.02em]">
              Tuition <span className="italic">Ticker</span>
            </span>
          </div>
          <span className="num font-mono text-[24px] text-muted">{date}</span>
        </div>
        <div className="mt-7 truncate font-title text-[40px] leading-tight text-fg-2">{schoolName}</div>
        <div className="mt-12 h-px bg-line" />

        <div className="flex flex-1 flex-col justify-center">
          <div className="flex items-center gap-4 font-mono text-[26px] tracking-[0.14em] text-muted uppercase">
            <span className={`size-[14px] shrink-0 rounded-full ${live ? 'bg-live' : 'bg-muted'}`} />
            <span className={`truncate ${live ? 'text-live' : ''}`}>{eyebrow}</span>
          </div>
          <Money
            amount={heroAmount}
            currency={currency}
            kind={heroKind}
            className={`mt-8 block leading-[0.95] font-light tracking-[-0.045em] ${story ? 'text-[200px]' : 'text-[184px]'}`}
            symbolClassName="mr-[0.14em] align-[0.95em] text-[0.22em] font-normal tracking-normal text-muted"
            fractionClassName="text-muted"
          />
          {!hideAmounts && (
            <Approx amount={heroAmount} kind={heroKind} className="mt-5 block text-[48px] font-light" />
          )}

          <div className={`grid grid-cols-3 gap-10 ${story ? 'mt-24' : 'mt-16'}`}>
            {stats.slice(0, 3).map((s) => (
              <Stat key={s.label} label={s.label}>
                {s.value}
              </Stat>
            ))}
          </div>
          <div className="mt-12 h-[8px] w-full overflow-hidden rounded-full bg-track">
            <div className="h-full rounded-full bg-bar" style={{ width: pct(totals.progress) }} />
          </div>
          <div className="num mt-4 font-mono text-[22px] text-muted">
            {t('tuitionUsed', { p: pct(totals.progress) })}
          </div>
        </div>

        <p className={`font-serif text-[44px] leading-snug text-fg-2 italic ${story ? 'mb-20' : 'mb-12'}`}>
          {quip}
        </p>
        <div className="flex items-center justify-between border-t border-line pt-8 font-mono text-[24px] text-muted">
          <span>{SITE_LABEL}</span>
          <span>Tuition Ticker</span>
        </div>
      </div>
    </PrivacyProvider>
  );
});
