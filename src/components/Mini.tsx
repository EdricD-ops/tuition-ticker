import type { ReactNode } from 'react';
import { formatDuration, type Snapshot } from '../core';
import { t } from '../app/i18n';
import { Approx } from './Fx';
import { Money } from './Money';
import { LiveDot, ProgressBar, pct } from './ui';

/**
 * Hero figure sized by the window it lives in (the page, a small app window or the
 * always-on-top pop-out), so it fills a tiny window and stays sane on a big one.
 */
const FIGURE =
  'block text-[clamp(2.25rem,min(17vw,33vh),9rem)] leading-[0.95] font-light tracking-[-0.045em]';
const SYMBOL = 'mr-[0.12em] align-[0.85em] text-[0.24em] font-normal tracking-normal text-muted';
const APPROX = 'mt-1 block text-[clamp(0.8rem,min(3.6vw,6.5vh),1.5rem)] font-light';

function Eyebrow({ live = false, children }: { live?: boolean; children: ReactNode }) {
  return (
    <div className="eyebrow flex min-w-0 items-center gap-2">
      <LiveDot on={live} />
      <span className={`truncate ${live ? 'text-live' : ''}`}>{children}</span>
    </div>
  );
}

function Foot({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="num mt-2 flex items-baseline justify-between gap-3 font-mono text-[11px] text-muted">
      <span className="min-w-0 truncate">{left}</span>
      <span className="shrink-0">{right}</span>
    </div>
  );
}

/**
 * The compact dashboard: this class's spend, cost per second and progress. Without a class
 * picked it falls back to the programme total so the widget is never blank.
 */
export function MiniBoard({
  snap,
  currency,
  toolbar,
}: {
  snap: Snapshot;
  currency: string;
  /** Buttons shown top-right (page view only; the pop-out has the browser's own). */
  toolbar?: ReactNode;
}) {
  const { current, totals } = snap;
  let eyebrow: ReactNode;
  let body: ReactNode;

  if (snap.status === 'unconfigured') {
    eyebrow = <Eyebrow>{t('offClass')}</Eyebrow>;
    body = <p className="mt-3 font-title text-2xl">{t('unconfiguredTitle')}</p>;
  } else if (current && snap.status === 'in-class') {
    eyebrow = <Eyebrow live>{current.courseName}</Eyebrow>;
    body = (
      <>
        <Money
          amount={current.spent}
          currency={currency}
          kind="live"
          roll
          scale="class"
          className={`mt-2 ${FIGURE}`}
          symbolClassName={SYMBOL}
          fractionClassName="text-muted"
        />
        <Approx amount={current.spent} kind="live" scale="class" className={APPROX} />
        <ProgressBar value={current.progress} className="mt-3" />
        <Foot
          left={
            <>
              {t('perSecond')}{' '}
              <Money amount={snap.costPerSecond} currency={currency} kind="rate" scale="class" symbolClassName="" />
            </>
          }
          right={
            <>
              {pct(current.progress)} · {formatDuration(current.remainingSeconds)}
            </>
          }
        />
      </>
    );
  } else if (current && snap.status === 'before-start') {
    eyebrow = <Eyebrow>{`${t('startsIn')} · ${current.courseName}`}</Eyebrow>;
    body = (
      <>
        <div className={`num mt-2 ${FIGURE}`}>{formatDuration(current.startsInSeconds)}</div>
        <Foot
          left={
            <>
              {t('classWorth')}{' '}
              <Money amount={current.cost} currency={currency} kind="live" symbolClassName="" />
            </>
          }
          right={null}
        />
      </>
    );
  } else if (current && snap.status === 'finished') {
    eyebrow = <Eyebrow>{`${t('finishedTitle')} · ${current.courseName}`}</Eyebrow>;
    body = (
      <>
        <Money
          amount={current.cost}
          currency={currency}
          kind="live"
          className={`mt-2 ${FIGURE}`}
          symbolClassName={SYMBOL}
          fractionClassName="text-muted"
        />
        <Approx amount={current.cost} kind="live" className={APPROX} />
      </>
    );
  } else if (snap.quick) {
    // Quick mode has no term-to-date figure: show what one class costs.
    eyebrow = <Eyebrow>{`${t('offClass')} · ${t('oneClassCosts')}`}</Eyebrow>;
    body = (
      <>
        <Money
          amount={totals.averageSessionCost}
          currency={currency}
          kind="live"
          className={`mt-2 ${FIGURE}`}
          symbolClassName={SYMBOL}
          fractionClassName="text-muted"
        />
        <Approx amount={totals.averageSessionCost} kind="live" className={APPROX} />
        <Foot
          left={
            <>
              {t('perSecond')}{' '}
              <Money amount={snap.costPerSecond} currency={currency} kind="rate" scale="class" symbolClassName="" />
            </>
          }
          right={null}
        />
      </>
    );
  } else {
    eyebrow = <Eyebrow>{`${t('offClass')} · ${t('spentSoFar')}`}</Eyebrow>;
    body = (
      <>
        <Money
          amount={totals.spent}
          currency={currency}
          kind="total"
          className={`mt-2 ${FIGURE}`}
          symbolClassName={SYMBOL}
        />
        <Approx amount={totals.spent} kind="total" className={APPROX} />
        <ProgressBar value={totals.progress} tone="bar" className="mt-3" />
        <Foot left={t('tuitionUsed', { p: pct(totals.progress) })} right={null} />
      </>
    );
  }

  return (
    <div className="flex min-h-svh flex-col justify-center bg-bg px-[clamp(14px,5vw,48px)] py-3 text-fg">
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex items-center justify-between gap-3">
          {eyebrow}
          {toolbar && <div className="flex shrink-0 items-center gap-2">{toolbar}</div>}
        </div>
        {body}
      </div>
    </div>
  );
}
