import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

/**
 * How much money is masked on screen (photos in class):
 * 0 — nothing; 1 — tuition-scale amounts (totals, per-class prices); 2 — every amount.
 * The live figures of the class in progress (spent, left, per second) only hide at 2.
 */
export type PrivacyLevel = 0 | 1 | 2;

/**
 * What an amount reveals. `class`: the class in progress (spent so far, left, per second).
 * `tuition`: anything that exposes the size of the tuition (totals, per-class prices).
 */
export type AmountScale = 'class' | 'tuition';

export const isMasked = (level: PrivacyLevel, scale: AmountScale): boolean =>
  level >= 2 || (level >= 1 && scale === 'tuition');

export const nextLevel = (level: PrivacyLevel): PrivacyLevel => ((level + 1) % 3) as PrivacyLevel;

const KEY = 'tuition-ticker:privacy-level';
/** Before levels existed, "1" here meant every amount was masked. */
const LEGACY_KEY = 'tuition-ticker:privacy';

function readStored(): PrivacyLevel {
  try {
    const v = localStorage.getItem(KEY);
    if (v === '1' || v === '2') return Number(v) as PrivacyLevel;
    if (localStorage.getItem(LEGACY_KEY) === '1') return 2;
  } catch {
    // Blocked storage: start with nothing masked.
  }
  return 0;
}

function store(level: PrivacyLevel): void {
  try {
    localStorage.removeItem(LEGACY_KEY);
    if (level === 0) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, String(level));
  } catch {
    // The level still applies for this visit.
  }
}

const PrivacyContext = createContext<PrivacyLevel>(0);

export const usePrivacy = () => useContext(PrivacyContext);

/** Privacy level, remembered on this device; `cycle` steps 0 → 1 → 2 → 0. */
export function usePrivacyState(): [PrivacyLevel, () => void] {
  const [level, setLevel] = useState(readStored);
  const cycle = useCallback(() => {
    setLevel((v) => {
      const next = nextLevel(v);
      store(next);
      return next;
    });
  }, []);
  return [level, cycle];
}

export function PrivacyProvider({ level, children }: { level: PrivacyLevel; children: ReactNode }) {
  return <PrivacyContext.Provider value={level}>{children}</PrivacyContext.Provider>;
}

/** What a masked amount shows instead of digits. Fixed length so it reveals nothing. */
export const MASK = '****';

/**
 * Eye icon for each level: open, closed, closed with a slash. Drawn on a 24px grid with
 * `currentColor` so it follows the button's text colour.
 */
export function PrivacyIcon({ level, className = 'size-[18px]' }: { level: PrivacyLevel; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {level === 0 ? (
        <>
          <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z" />
          <circle cx="12" cy="12" r="2.75" />
        </>
      ) : (
        <>
          {/* Closed lid with lashes. */}
          <path d="M3 8.5c2.4 3 5.4 4.5 9 4.5s6.6-1.5 9-4.5" />
          <path d="M5.6 11.4 4.2 13.4M9.6 12.8 9 15.2M14.4 12.8l.6 2.4M18.4 11.4l1.4 2" />
          {level === 2 && <path d="M4 4l16 16" />}
        </>
      )}
    </svg>
  );
}
