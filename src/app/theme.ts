/** Colour theme: follow the system (default) or force light / dark. Stored per device. */
export type ThemePref = 'system' | 'light' | 'dark';

const KEY = 'tuition-ticker:theme';
const listeners = new Set<() => void>();

function read(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

let pref: ThemePref = read();

/**
 * CSS reads `data-theme` on <html>; without it, `prefers-color-scheme` decides and follows
 * system switches live. index.html applies the stored choice before first paint.
 */
function apply(): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (pref === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', pref);
}
apply();

export const getThemePref = (): ThemePref => pref;

export function setThemePref(next: ThemePref): void {
  pref = next;
  try {
    if (next === 'system') localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, next);
  } catch {
    // Applies until reload.
  }
  apply();
  listeners.forEach((fn) => fn());
}

export function subscribeTheme(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
