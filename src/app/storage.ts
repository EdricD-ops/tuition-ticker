import type { ClassWindow, TickerConfig } from '../core';
import { parseConfig } from './configIO';

const KEYS = {
  config: 'tuition-ticker:config',
  active: 'tuition-ticker:active',
} as const;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be full or blocked (private mode); the app keeps working in memory.
  }
}

const isWindow = (w: unknown): w is ClassWindow =>
  typeof w === 'object' &&
  w !== null &&
  typeof (w as ClassWindow).courseId === 'string' &&
  typeof (w as ClassWindow).date === 'string' &&
  Number.isFinite((w as ClassWindow).start) &&
  Number.isFinite((w as ClassWindow).end);

/** The user's saved config, or null for first-time visitors (who see the demo). */
export function loadConfig(): TickerConfig | null {
  return parseConfig(read<unknown>(KEYS.config));
}

export function saveConfig(config: TickerConfig): void {
  write(KEYS.config, config);
}

/** Forgets the saved config and picked class, so the next load shows the demo. */
export function clearSavedData(): void {
  write(KEYS.config, null);
  write(KEYS.active, null);
}

/** The picked class, kept across reloads until it ends. */
export function loadActive(now: number): ClassWindow | null {
  const a = read<unknown>(KEYS.active);
  return isWindow(a) && now < a.end ? a : null;
}

export function saveActive(active: ClassWindow | null): void {
  write(KEYS.active, active);
}
