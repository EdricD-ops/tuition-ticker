import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  coursesInSession,
  createPlan,
  schoolLabel,
  dateInTimeZone,
  getSnapshot,
  holidayOn,
  startClass,
  startQuickClass,
  type ClassWindow,
  type TickerConfig,
} from './core';
import { demoExpired, makeDemo, type Demo } from './app/demo';
import { track } from './app/analytics';
import { clearShareHash, decodeConfig, sharePayload } from './app/shareLink';
import quips from './data/quips.json';
import { publicHolidaysFor } from './app/holidayData';
import { loc, quipList, t } from './app/i18n';
import { clearSavedData, loadActive, loadConfig, saveActive, saveConfig } from './app/storage';
import { useNow } from './app/useNow';
import { usePip } from './app/usePip';
import { readView, writeView, type View } from './app/view';
import { MiniBoard } from './components/Mini';
import { FxProvider } from './components/Fx';
import { Footer } from './components/Footer';
import { SettingsDrawer } from './components/settings/SettingsDrawer';
import { SetupWizard } from './components/settings/SetupWizard';
import { LogoMark } from './components/LogoMark';
import { PrivacyIcon, PrivacyProvider, usePrivacyState, type PrivacyLevel } from './components/Privacy';
import { ShareDialog } from './components/share/ShareDialog';
import { Button, LiveDot } from './components/ui';
import {
  BeforeStart,
  ConfirmDialog,
  CoursePicker,
  Finished,
  LiveClass,
  QuickHero,
  QuickStart,
  QuickTotals,
  SemesterHero,
  Totals,
} from './components/views';

const MINUTE = 60_000;

export default function App() {
  const [view, setView] = useState<View>(readView);
  const changeView = (next: View) => {
    if (next === 'mini') track('view-mini');
    writeView(next);
    setView(next);
  };
  // While the pop-out is open, its animation frames drive the clock: they keep running
  // when the main window is minimised.
  const pip = usePip();
  const now = useNow(pip.win ?? window);

  // A saved config means a real user; otherwise first-time visitors get the live demo.
  const [savedConfig, setSavedConfig] = useState(loadConfig);
  const isDemo = savedConfig === null;
  const [demo, setDemo] = useState<Demo | null>(() => (isDemo ? makeDemo(Date.now()) : null));
  const config = savedConfig ?? demo!.config;

  const [active, setActive] = useState<ClassWindow | null>(() =>
    isDemo ? demo!.active : loadActive(Date.now()),
  );
  // A start held back by the holiday confirmation.
  const [pendingStart, setPendingStart] = useState<(() => void) | null>(null);
  const [overlay, setOverlay] = useState<'setup' | 'share' | null>(null);
  const closeOverlay = useCallback(() => setOverlay(null), []);
  // The settings drawer edits a copy of `config`: the saved one, or one from a share link.
  const [drawer, setDrawer] = useState<{ config: TickerConfig; banner?: string; flagErrors?: boolean } | null>(
    null,
  );
  const closeDrawer = useCallback(() => setDrawer(null), []);
  const openSettings = () => savedConfig && setDrawer({ config: savedConfig });
  const [linkError, setLinkError] = useState(false);
  const [privacy, cyclePrivacy] = usePrivacyState();
  const [shareQuip, setShareQuip] = useState('');
  const openShare = () => {
    const list = quipList(quips);
    setShareQuip(list[Math.floor(Math.random() * list.length)] ?? '');
    setOverlay('share');
    track('share-open');
  };

  // A share link (#share=…) opens its config in the settings form; nothing is saved
  // until the user presses Save.
  useEffect(() => {
    const payload = sharePayload(location.hash);
    if (!payload) return;
    clearShareHash();
    void decodeConfig(payload).then((shared) => {
      if (shared) {
        setDrawer({ config: shared, banner: t('sharedLoaded'), flagErrors: true });
        track('share-link-open');
      }
      else setLinkError(true);
    });
  }, []);

  /** Quick mode → the settings form switched to the timetable, ready to fill in. */
  const openUpgrade = () => {
    if (!savedConfig) return;
    track('quick-upgrade');
    setDrawer({ config: { ...savedConfig, mode: 'full' }, banner: t('upgradeBanner') });
  };

  /** Leaves the demo (or applies edits) and persists the config. */
  const applyConfig = (next: TickerConfig) => {
    saveConfig(next);
    if (isDemo) {
      track('setup-complete');
      if (next.mode === 'quick') track('setup-quick');
      setDemo(null);
      setActive(loadActive(Date.now()));
    } else if ((next.mode ?? 'full') !== (savedConfig?.mode ?? 'full')) {
      // A class picked under the other mode belongs to a course that no longer applies.
      setActive(null);
    }
    setSavedConfig(next);
    setOverlay(null);
    setDrawer(null);
  };

  /** Forgets the saved config and goes back to the live demo. */
  const resetToDemo = () => {
    clearSavedData();
    track('reset-demo');
    const fresh = makeDemo(Date.now());
    setDemo(fresh);
    setActive(fresh.active);
    setPendingStart(null);
    setSavedConfig(null);
    setDrawer(null);
  };

  // Keep the demo "on class": rebuild it once its live class ends. In the rare minute where
  // no class fits before midnight, fall back to the static semester view.
  useEffect(() => {
    if (!isDemo || !demo || !demoExpired(demo, now)) return;
    const next = makeDemo(now);
    if (demoExpired(next, now)) {
      if (active === demo.active) setActive(null);
      return;
    }
    setDemo(next);
    setActive(next.active);
  }, [isDemo, demo, now, active]);

  // Persist real users' state only; the demo lives in memory.
  useEffect(() => {
    if (!isDemo) saveActive(active);
  }, [isDemo, active]);

  const publicHolidays = useMemo(() => publicHolidaysFor(config.region), [config.region]);
  const plan = useMemo(() => createPlan(config, publicHolidays), [config, publicHolidays]);
  const snap = getSnapshot(plan, active, now);
  // Quick mode has no course names: its class is simply "this class".
  if (snap.quick && snap.current && !snap.current.courseName) snap.current.courseName = t('thisClass');

  // Holiday and "happening now" only change on minute boundaries.
  const minute = Math.floor(now / MINUTE);
  const holiday = useMemo(
    () => holidayOn(config, publicHolidays, minute * MINUTE),
    [config, publicHolidays, minute],
  );
  const happeningNow = useMemo(() => coursesInSession(plan, minute * MINUTE), [plan, minute]);

  const startCourse = useCallback(
    (courseId: string) => {
      const win = startClass(plan, courseId, Date.now());
      if (!win) return;
      setActive(win);
    },
    [plan],
  );

  /** Starts right away, or after a confirmation on holidays. */
  const guarded = (start: () => void) => {
    if (holiday) setPendingStart(() => start);
    else start();
  };
  const pick = (courseId: string) => guarded(() => startCourse(courseId));
  const startQuick = (elapsedMinutes: number) =>
    guarded(() => setActive(startQuickClass(plan, Date.now(), elapsedMinutes)));

  const cancel = () => setActive(null);

  const holidayName = holiday ? loc(holiday.holiday.name) : '';
  const onClass = snap.status === 'in-class';
  const statusLabel = onClass ? t('onClass') : holiday ? t('holiday') : t('offClass');
  const currency = config.currency;

  const hero =
    snap.status === 'unconfigured' ? (
      <section>
        <h2 className="font-title text-4xl">{t('unconfiguredTitle')}</h2>
        <p className="mt-3 max-w-prose text-fg-2">{t('unconfiguredBody')}</p>
        {!isDemo && (
          <div className="mt-6">
            <Button variant="primary" onClick={openSettings}>
              {t('openSettings')}
            </Button>
          </div>
        )}
      </section>
    ) : snap.current && snap.status === 'in-class' ? (
      <LiveClass
        current={snap.current}
        costPerSecond={snap.costPerSecond}
        currency={currency}
        onCancel={cancel}
      />
    ) : snap.current && snap.status === 'before-start' ? (
      <BeforeStart current={snap.current} currency={currency} onCancel={cancel} />
    ) : snap.current && snap.status === 'finished' ? (
      <Finished current={snap.current} currency={currency} onBack={() => setActive(null)} />
    ) : plan.quick ? (
      <QuickHero snap={snap} minutes={plan.quick.minutes} currency={currency} />
    ) : (
      <SemesterHero snap={snap} currency={currency} />
    );

  const side =
    snap.status === 'unconfigured' ? null : plan.quick ? (
      snap.status === 'idle' ? (
        <QuickStart minutes={plan.quick.minutes} onStart={startQuick} onUpgrade={openUpgrade} />
      ) : (
        <QuickTotals snap={snap} minutes={plan.quick.minutes} currency={currency} onUpgrade={openUpgrade} />
      )
    ) : snap.status === 'idle' ? (
      <CoursePicker plan={plan} happeningNow={happeningNow} at={minute * MINUTE} onPick={pick} />
    ) : (
      <Totals snap={snap} currency={currency} />
    );

  const pipButton = pip.supported && (
    <Button onClick={pip.win ? pip.close : () => {
      track('pip-open');
      void pip.open();
    }} title={t('pipOpenHint')}>
      {pip.win ? t('pipClose') : t('pipOpen')}
    </Button>
  );

  return (
    <PrivacyProvider level={privacy}>
      <FxProvider from={currency} to={config.displayCurrency} fixedRate={config.fixedRate}>
        {pip.win && createPortal(<MiniBoard snap={snap} currency={currency} />, pip.win.document.body)}
        {view === 'mini' ? (
          <MiniBoard
            snap={snap}
            currency={currency}
            toolbar={
              <>
                {pipButton}
                <Button onClick={() => changeView('full')}>{t('fullView')}</Button>
              </>
            }
          />
        ) : (
          <div className="flex min-h-svh flex-col">
            <Header
              schoolName={schoolLabel(config)}
              statusLabel={statusLabel}
              live={onClass}
              isDemo={isDemo}
              onSetup={() => {
                setOverlay('setup');
                track('setup-open');
              }}
              onSettings={openSettings}
              privacy={privacy}
              onShare={openShare}
              onCyclePrivacy={cyclePrivacy}
              />

            <main className="mx-auto grid w-full max-w-[1400px] flex-1 content-center items-center gap-10 px-5 py-8 sm:px-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(340px,1fr)] lg:gap-16 lg:py-6">
              <div className="min-w-0">
                {linkError && (
                <div className="rise mb-6 flex items-center gap-3 rounded-md border border-red-500/40 bg-surface px-3 py-1.5 text-[13px]">
                  <span className="text-red-500">{t('sharedInvalid')}</span>
                  <button
                    type="button"
                    onClick={() => setLinkError(false)}
                    aria-label={t('dismiss')}
                    className="text-muted hover:text-fg"
                  >
                    ✕
                  </button>
                </div>
              )}
              {holiday && (
                  <div className="rise mb-8 inline-flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-1.5 text-[13px]">
                    <span className="size-1.5 rounded-full bg-bar" />
                    <span className="font-medium">{t('holidayToday', { name: holidayName })}</span>
                    <span className="text-muted">
                      · {holiday.source === 'custom' ? t('holidaySchool') : t('holidayPublic')}
                    </span>
                  </div>
                )}
                {hero}
                {plan.issues.some((i) => i.code === 'non-positive-tuition') && (
                  <p className="mt-6 text-sm text-muted">{t('zeroTuition')}</p>
                )}
              </div>
              {side && <div className="min-w-0">{side}</div>}
            </main>

            <Footer onMini={() => changeView('mini')} />

            {overlay === 'setup' && <SetupWizard onFinish={applyConfig} onClose={closeOverlay} />}
            {overlay === 'share' && (
              <ShareDialog
                snap={snap}
                config={config}
                isDemo={isDemo}
                quip={shareQuip}
                date={dateInTimeZone(now, config.timeZone)}
                defaultHideAmounts={privacy > 0}
                onClose={closeOverlay}
              />
            )}
            {drawer && (
              <SettingsDrawer
                config={drawer.config}
                banner={drawer.banner}
                flagErrors={drawer.flagErrors}
                onSave={applyConfig}
                onClose={closeDrawer}
                onReset={savedConfig ? resetToDemo : undefined}
              />
            )}

            {pendingStart && (
              <ConfirmDialog
                title={t('holidayConfirmTitle')}
                body={t('holidayConfirmBody', { name: holidayName })}
                confirmLabel={t('confirmStart')}
                onCancel={() => setPendingStart(null)}
                onConfirm={() => {
                  pendingStart();
                  setPendingStart(null);
                }}
              />
            )}
          </div>
        )}
      </FxProvider>
    </PrivacyProvider>
  );
}

function Header({
  schoolName,
  statusLabel,
  live,
  isDemo,
  privacy,
  onSetup,
  onSettings,
  onShare,
  onCyclePrivacy,
}: {
  schoolName: string;
  statusLabel: string;
  live: boolean;
  isDemo: boolean;
  privacy: PrivacyLevel;
  onSetup: () => void;
  onSettings: () => void;
  onShare: () => void;
  onCyclePrivacy: () => void;
}) {
  // One eye button cycles: open (nothing hidden) → closed (totals hidden) → slashed (all).
  const privacyTitle = t(privacy === 0 ? 'privacy0' : privacy === 1 ? 'privacy1' : 'privacy2');
  const privacyButton = (className = '') => (
    <Button
      onClick={onCyclePrivacy}
      title={privacyTitle}
      ariaLabel={privacyTitle}
      pressed={privacy > 0}
      className={`px-2! ${className}`}
    >
      <PrivacyIcon level={privacy} className="block size-[18px]" />
    </Button>
  );
  const SMALL = 'h-7! px-2.5! text-xs!';

  return (
    // Phones put the bar at the very end of the page, after the footer, so the page opens
    // on the live number; from 640px up it is the sticky top bar.
    <header className="order-last border-t border-line bg-bg/85 backdrop-blur sm:sticky sm:top-0 sm:z-10 sm:order-none sm:border-t-0 sm:border-b">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-5 sm:h-[76px] sm:px-10">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex shrink-0 items-center gap-2.5">
            <LogoMark />
            <span className="font-title text-[clamp(22px,7vw,26px)] leading-none tracking-[-0.02em] sm:text-[30px]">
              Tuition <span className="italic">Ticker</span>
            </span>
          </span>
          {/* Between 640 and 768 px the buttons need the room, so the school name steps aside. */}
          {schoolName && (
            <>
              <span className="hidden h-7 w-px bg-line md:block" />
              <span className="hidden truncate font-title text-lg leading-none text-fg-2 md:block">
                {schoolName}
              </span>
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="eyebrow hidden items-center gap-2 lg:flex">
            <LiveDot on={live} />
            <span className={live ? 'text-live' : ''}>{statusLabel}</span>
            {isDemo && <span>· {t('demo')}</span>}
          </span>
          {isDemo ? (
            <Button variant="primary" onClick={onSetup}>
              {t('useMySchool')}
            </Button>
          ) : (
            <Button onClick={onSettings}>{t('settings')}</Button>
          )}
          {/* Phones get share and privacy on the second row. */}
          <Button onClick={onShare} className="hidden sm:inline-block">
            {t('share')}
          </Button>
          {privacyButton('hidden sm:inline-block')}
        </div>
      </div>
      <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-5 pb-2.5 sm:hidden">
        <LiveDot on={live} />
        <span className={`eyebrow ${live ? 'text-live' : ''}`}>{statusLabel}</span>
        <span className="min-w-0 flex-1 truncate text-[13px] text-fg-2">{schoolName && `· ${schoolName}`}</span>
        <Button onClick={onShare} className={SMALL}>
          {t('share')}
        </Button>
        {privacyButton(SMALL)}
      </div>
    </header>
  );
}
