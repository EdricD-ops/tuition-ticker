/** Decimal places per figure type (see CLAUDE.md §10). */
export const DECIMALS = {
  live: 1, // amount consumed in the current class
  rate: 4, // cost per second
  total: 0, // tuition-level totals
} as const;

export type AmountKind = keyof typeof DECIMALS;

const cache = new Map<string, Intl.NumberFormat>();

function formatter(currency: string, kind: AmountKind, locale?: string): Intl.NumberFormat {
  const digits = DECIMALS[kind];
  const key = `${locale ?? ''}|${currency}|${digits}`;
  let fmt = cache.get(key);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    cache.set(key, fmt);
  }
  return fmt;
}

const safe = (n: number) => (Number.isFinite(n) ? n : 0);

export function formatMoney(
  amount: number,
  currency: string,
  kind: AmountKind,
  locale?: string,
): string {
  return formatter(currency, kind, locale).format(safe(amount));
}

/** Same as `formatMoney`, split into parts so the UI can style the currency symbol. */
export function moneyParts(
  amount: number,
  currency: string,
  kind: AmountKind,
  locale?: string,
): Intl.NumberFormatPart[] {
  return formatter(currency, kind, locale).formatToParts(safe(amount));
}

/** Formats seconds as `HH:MM:SS` (hours are not capped at 24). Negative input shows 00:00:00. */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** "School · Programme", or just the school when no programme is set. */
export function schoolLabel(config: { schoolName: string; programme: string }): string {
  const programme = config.programme.trim();
  return programme ? `${config.schoolName.trim()} · ${programme}` : config.schoolName.trim();
}
