import { useEffect, useState, type ReactNode } from 'react';
import {
  courseCost,
  formatDuration,
  meetsToday,
  type CurrentClass,
  type Plan,
  type Snapshot,
} from '../core';
import { daysLabel } from './settings/ImportDialog';
import { lang, t } from '../app/i18n';
import quips from '../data/quips.json';
import { Approx } from './Fx';
import { Money } from './Money';
import { Button, LiveDot, Panel, ProgressBar, Row, Tag, pct, riseStyle } from './ui';

/** Hero figure size: limited by both width and height so it always fits one screen. */
const HERO_NUMBER =
  'block text-[clamp(3.25rem,16vw,6.5rem)] lg:text-[clamp(4rem,min(10.5vw,19vh),11rem)] leading-[0.92] font-light tracking-[-0.045em]';
/** Converted amount under the hero figure. */
const HERO_APPROX = 'rise mt-3 block text-[clamp(1.05rem,4.5vw,1.4rem)] lg:text-[clamp(1.1rem,min(1.9vw,3.4vh),1.75rem)] font-light tracking-[-0.01em]';

const HERO_SYMBOL = 'mr-[0.14em] align-[0.95em] text-[0.22em] font-normal tracking-normal text-muted';

/** Eyebrow + serif title + optional action, shared by every hero state. */
function HeroHead({
  eyebrow,
  title,
  live = false,
  action,
}: {
  eyebrow: string;
  title?: string;
  live?: boolean;
  action?: ReactNode;
}) {
  return (
    <div className="rise flex items-end justify-between gap-4" style={riseStyle(0)}>
      <div className="min-w-0">
        <div className="eyebrow flex items-center gap-2">
          {live && <LiveDot />}
          {eyebrow}
        </div>
        {title && (
          <h2 className="mt-2 truncate font-title text-[clamp(1.6rem,2.9vw,2.5rem)] leading-[1.1] tracking-[-0.015em]">
            {title}
          </h2>
        )}
      </div>
      {action}
    </div>
  );
}

/** A thin row of secondary facts under the hero figure. */
function Caption({ children }: { children: ReactNode }) {
  return (
    <div
      className="rise mt-5 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-sm text-muted"
      style={riseStyle(2)}
    >
      {children}
    </div>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="whitespace-nowrap">
      {label} <span className="num font-mono text-fg-2">{children}</span>
    </span>
  );
}

/** Big, live-updating figure for the class in progress. */
export function LiveClass({
  current,
  costPerSecond,
  currency,
  onCancel,
}: {
  current: CurrentClass;
  costPerSecond: number;
  currency: string;
  onCancel: () => void;
}) {
  return (
    <div>
      <HeroHead
        eyebrow={t('spentThisClass')}
        title={current.courseName}
        live
        action={<Button onClick={onCancel}>{t('cancelClass')}</Button>}
      />
      <Money
        amount={current.spent}
        currency={currency}
        kind="live"
        roll
        scale="class"
        className={`rise mt-6 ${HERO_NUMBER}`}
        symbolClassName={HERO_SYMBOL}
        fractionClassName="text-muted"
      />
      <Approx amount={current.spent} kind="live" scale="class" className={HERO_APPROX} />
      <Caption>
        <Fact label={t('perSecond')}>
          <Money amount={costPerSecond} currency={currency} kind="rate" scale="class" symbolClassName="" />
          <Approx amount={costPerSecond} kind="rate" scale="class" className="ml-1.5" />
        </Fact>
        <Fact label={t('leftThisClass')}>
          <Money amount={current.remainingCost} currency={currency} kind="live" scale="class" symbolClassName="" />
          <Approx amount={current.remainingCost} kind="live" scale="class" className="ml-1.5" />
        </Fact>
      </Caption>
      <div className="rise mt-7" style={riseStyle(3)}>
        <ProgressBar value={current.progress} />
        <div className="num mt-2.5 flex justify-between font-mono text-xs text-muted">
          <span>
            <span className="text-fg">{formatDuration(current.elapsedSeconds)}</span> {t('elapsed')}
          </span>
          <span className="text-fg">{pct(current.progress)}</span>
          <span>
            {t('remaining')} <span className="text-fg">{formatDuration(current.remainingSeconds)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export function BeforeStart({
  current,
  currency,
  onCancel,
}: {
  current: CurrentClass;
  currency: string;
  onCancel: () => void;
}) {
  return (
    <div>
      <HeroHead
        eyebrow={t('startsIn')}
        title={current.courseName}
        action={<Button onClick={onCancel}>{t('cancelClass')}</Button>}
      />
      <div className={`rise num mt-6 ${HERO_NUMBER}`} style={riseStyle(1)}>
        {formatDuration(current.startsInSeconds)}
      </div>
      <Caption>
        <Fact label={t('classWorth')}>
          <Money amount={current.cost} currency={currency} kind="live" symbolClassName="" />
          <Approx amount={current.cost} kind="live" className="ml-1.5" />
        </Fact>
      </Caption>
    </div>
  );
}

export function Finished({
  current,
  currency,
  onBack,
}: {
  current: CurrentClass;
  currency: string;
  onBack: () => void;
}) {
  return (
    <div>
      <HeroHead
        eyebrow={t('finishedTitle')}
        title={current.courseName}
        action={
          <Button variant="primary" onClick={onBack}>
            {t('pickAnother')}
          </Button>
        }
      />
      <Money
        amount={current.cost}
        currency={currency}
        kind="live"
        className={`rise mt-6 ${HERO_NUMBER}`}
        symbolClassName={HERO_SYMBOL}
        fractionClassName="text-muted"
      />
      <Approx amount={current.cost} kind="live" className={HERO_APPROX} />
      <Caption>
        <span>{t('finishedBody')}</span>
      </Caption>
    </div>
  );
}

/** Eases a number from 0 to `target` once, on mount. */
function useCountUp(target: number, ms = 1200): number {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(1);
      return;
    }
    const start = performance.now();
    let id = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / ms);
      setProgress(1 - Math.pow(1 - p, 4));
      if (p < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [ms]);
  return target * progress;
}

/** Static hero shown when no class is picked: what the programme has cost so far. */
export function SemesterHero({ snap, currency }: { snap: Snapshot; currency: string }) {
  const { totals } = snap;
  const spent = useCountUp(totals.spent);
  return (
    <div>
      <HeroHead eyebrow={t('offClass')} title={t('spentSoFar')} />
      <Money
        amount={spent}
        currency={currency}
        kind="total"
        className={`rise mt-6 ${HERO_NUMBER}`}
        symbolClassName={HERO_SYMBOL}
      />
      <Approx amount={spent} kind="total" className={HERO_APPROX} />
      <Caption>
        <Fact label={t('tuitionLeft')}>
          <Money amount={totals.remaining} currency={currency} kind="total" symbolClassName="" />
          <Approx amount={totals.remaining} kind="total" className="ml-1.5" />
        </Fact>
        <Fact label={t('classesLeft')}>{t('classesCount', { n: totals.sessionsRemaining })}</Fact>
        <Fact label={t('avgPerClass')}>
          <Money amount={totals.averageSessionCost} currency={currency} kind="live" symbolClassName="" />
          <Approx amount={totals.averageSessionCost} kind="live" className="ml-1.5" />
        </Fact>
      </Caption>
      <div className="rise mt-7 flex items-center gap-3" style={riseStyle(3)}>
        <ProgressBar value={totals.progress} tone="bar" animateIn />
        <span className="num shrink-0 font-mono text-xs text-muted">
          {t('tuitionUsed', { p: pct(totals.progress) })}
        </span>
      </div>
    </div>
  );
}

export function CoursePicker({
  plan,
  happeningNow,
  at,
  onPick,
}: {
  plan: Plan;
  happeningNow: string[];
  /** The instant used to decide which courses meet today. */
  at: number;
  onPick: (courseId: string) => void;
}) {
  const now = new Set(happeningNow);
  // Class in progress first, then the rest of today's classes, then everything else.
  const rank = (id: string, today: boolean) => (now.has(id) ? 0 : today ? 1 : 2);
  const courses = plan.courses
    .map((c) => ({ c, today: meetsToday(plan, c, at) }))
    .sort((a, b) => rank(a.c.id, a.today) - rank(b.c.id, b.today))
    .map(({ c }) => c);
  return (
    <Panel
      title={t('pickTitle')}
      tag={<Tag>{t('perClassTag')}</Tag>}
      className="rise"
      style={riseStyle(2)}
    >
      <p className="px-5 pb-3 text-[13px] text-muted sm:px-6">{t('pickHint')}</p>
      <ul>
        {courses.map((c, i) => {
          const highlighted = now.has(c.id);
          return (
            <li key={c.id} className="rise border-t border-line" style={riseStyle(3 + i)}>
              <button
                type="button"
                onClick={() => onPick(c.id)}
                className="group flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors duration-200 hover:bg-raised sm:px-6"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[16px] font-medium tracking-tight">{c.name}</span>
                    {highlighted && (
                      <span className="flex shrink-0 items-center gap-1.5 text-xs text-live">
                        <LiveDot />
                        {t('happeningNow')}
                      </span>
                    )}
                  </div>
                  <div className="num mt-0.5 font-mono text-xs text-muted">
                    {daysLabel(c.weekdays)} · {c.start} – {c.end}
                  </div>
                </div>
                <span className="flex shrink-0 flex-col items-end">
                  <Money
                    amount={courseCost(plan, c)}
                    currency={plan.config.currency}
                    kind="live"
                    className="font-mono text-sm text-fg-2"
                  />
                  <Approx amount={courseCost(plan, c)} kind="live" className="font-mono text-[11px]" />
                </span>
                <span className="text-lg text-muted transition duration-200 group-hover:translate-x-0.5 group-hover:text-fg">
                  ›
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/** Programme-level figures, shown beside the hero while a class is picked. */
export function Totals({ snap, currency }: { snap: Snapshot; currency: string }) {
  const { totals } = snap;
  const allDone = totals.sessionCount > 0 && totals.sessionsRemaining === 0;
  return (
    <Panel
      title={t('overview')}
      tag={<Tag>{t('overviewTag')}</Tag>}
      className="rise"
      style={riseStyle(2)}
    >
      <div className="px-5 pt-1 pb-4 sm:px-6">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-fg-2">{t('spentSoFar')}</span>
          <span className="num font-mono text-xs text-muted">
            {t('tuitionUsed', { p: pct(totals.progress) })}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
          <Money
            amount={totals.spent}
            currency={currency}
            kind="total"
            className="text-[34px] leading-tight font-light tracking-[-0.03em]"
          />
          <Approx amount={totals.spent} kind="total" className="text-[15px] font-light" />
        </div>
        <ProgressBar value={totals.progress} tone="bar" animateIn className="mt-3" />
      </div>
      <Row label={t('tuitionLeft')}>
        <Approx amount={totals.remaining} kind="total" className="mr-2 text-[13px] font-normal" />
        <Money amount={totals.remaining} currency={currency} kind="total" />
      </Row>
      <Row label={t('avgPerClass')}>
        <Approx amount={totals.averageSessionCost} kind="live" className="mr-2 text-[13px] font-normal" />
        <Money amount={totals.averageSessionCost} currency={currency} kind="live" />
      </Row>
      <Row label={t('classesLeft')}>{t('classesCount', { n: totals.sessionsRemaining })}</Row>
      {allDone && (
        <p className="border-t border-line px-5 py-3 text-sm text-muted sm:px-6">{t('allDone')}</p>
      )}
    </Panel>
  );
}

export function Quip() {
  const list: string[] = quips[lang];
  const [i, setI] = useState(() => Math.floor(Math.random() * list.length));
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % list.length), 8000);
    return () => clearInterval(id);
  }, [list.length]);
  return (
    <p key={i} className="rise text-center font-serif text-[17px] text-muted italic">
      {list[i]}
    </p>
  );
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm [animation:fade_200ms_ease_both]"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="rise w-full max-w-sm rounded-xl border border-line bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="font-serif text-2xl leading-tight">
          {title}
        </h2>
        <p className="mt-2 text-sm text-fg-2">{body}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button onClick={onCancel}>{t('cancel')}</Button>
          <Button variant="primary" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
