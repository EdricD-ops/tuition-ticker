import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { convert, resolveConversion, type AmountKind, type Conversion } from '../core';
import { locale, t } from '../app/i18n';
import { useRates } from '../app/useRates';
import { Money } from './Money';
import type { AmountScale } from './Privacy';

interface FxState {
  /** The conversion to show next to amounts, or null when off or unavailable. */
  conversion: Conversion | null;
  /** Conversion is turned on (a target currency differs from the tuition currency). */
  enabled: boolean;
  from: string;
  to: string | null;
  loading: boolean;
}

const FxContext = createContext<FxState>({
  conversion: null,
  enabled: false,
  from: '',
  to: null,
  loading: false,
});

/** Resolves the conversion once and shares it with every amount below. */
export function FxProvider({
  from,
  to,
  fixedRate,
  children,
}: {
  from: string;
  to: string | null;
  fixedRate: number | null;
  children: ReactNode;
}) {
  const enabled = !!to && to !== from;
  // A fixed rate needs no network; otherwise fetch tables quoted in the tuition currency.
  const needsTable = enabled && !(fixedRate && fixedRate > 0);
  const rates = useRates(needsTable ? from : null);
  const value = useMemo<FxState>(
    () => ({
      conversion: resolveConversion({
        from,
        to: enabled ? to : null,
        fixedRate,
        table: rates.table,
        tableIsCurrent: rates.current,
      }),
      enabled,
      from,
      to: enabled ? to : null,
      loading: rates.loading,
    }),
    [from, to, enabled, fixedRate, rates],
  );
  return <FxContext.Provider value={value}>{children}</FxContext.Provider>;
}

export const useFx = () => useContext(FxContext);

const rateFormats = new Map<string, Intl.NumberFormat>();
export function formatRate(rate: number): string {
  let fmt = rateFormats.get(locale);
  if (!fmt) {
    fmt = new Intl.NumberFormat(locale, { maximumSignificantDigits: 5 });
    rateFormats.set(locale, fmt);
  }
  return fmt.format(rate);
}

/**
 * "≈ ¥2,439.5": the amount in the user's familiar currency, meant to sit next to (or under)
 * the original. Renders nothing when conversion is off or no rate is known.
 */
export function Approx({
  amount,
  kind,
  className = '',
  symbolClassName = '',
  scale = 'tuition',
}: {
  amount: number;
  kind: AmountKind;
  className?: string;
  symbolClassName?: string;
  /** Masked like the amount it converts. */
  scale?: AmountScale;
}) {
  const { conversion } = useFx();
  if (!conversion) return null;
  return (
    <span className={`num whitespace-nowrap text-muted ${className}`}>
      <span aria-hidden>≈ </span>
      <Money
        amount={convert(amount, conversion)}
        currency={conversion.to}
        kind={kind}
        symbolClassName={symbolClassName}
        scale={scale}
      />
    </span>
  );
}

/** Small print stating which rate is in use and how old it is. */
export function RateNote({ className = '' }: { className?: string }) {
  const { conversion, enabled, from, to, loading } = useFx();
  if (!enabled || !to) return null;
  let text: string;
  if (conversion) {
    const line = t('rateLine', { from, to, rate: formatRate(conversion.rate) });
    const status =
      conversion.source === 'fixed'
        ? t('rateFixed')
        : conversion.source === 'cached'
          ? t('rateCached', { date: conversion.asOf ?? '' })
          : t('rateReference', { date: conversion.asOf ?? '' });
    text = `${line} · ${status}`;
  } else {
    text = loading ? t('rateLoading') : t('rateUnavailable', { from, to });
  }
  return <p className={`num font-mono text-[11px] text-muted ${className}`}>{text}</p>;
}
