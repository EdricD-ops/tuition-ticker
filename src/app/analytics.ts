/**
 * Anonymous usage counts through GoatCounter (no cookies, no personal data). The script tag
 * is in index.html; it ignores localhost, and nothing is sent when it is blocked or offline.
 *
 * Events carry a fixed name only. Never pass config values (school, tuition, courses): those
 * stay in the user's browser.
 */
export type TrackedEvent =
  | 'setup-open'
  | 'setup-complete'
  | 'reset-demo'
  | 'share-open'
  | 'share-png-3x4'
  | 'share-png-9x16'
  | 'share-link-copy'
  | 'share-link-open'
  | 'view-mini'
  | 'pip-open'
  | 'tip-bmc'
  | 'tip-afdian';

declare global {
  interface Window {
    goatcounter?: { count?: (vars: { path: string; title?: string; event?: boolean }) => void };
  }
}

export function track(event: TrackedEvent): void {
  try {
    window.goatcounter?.count?.({ path: event, title: event, event: true });
  } catch {
    // Analytics must never break the app.
  }
}
