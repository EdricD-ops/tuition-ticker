import { useRef } from 'react';
import { moneyParts, type AmountKind } from '../core';
import { locale, t } from '../app/i18n';
import { MASK, isMasked, usePrivacy, type AmountScale } from './Privacy';

/**
 * One digit slot. When its character changes, the old one slides up and fades out while
 * the new one rises in. Tabular digits keep every slot the same width.
 */
function RollingChar({ ch }: { ch: string }) {
  const current = useRef(ch);
  const previous = useRef<string | null>(null);
  const generation = useRef(0);
  if (current.current !== ch) {
    previous.current = current.current;
    current.current = ch;
    generation.current += 1;
  }
  const g = generation.current;
  return (
    <span className="digit-slot">
      {g > 0 && previous.current !== null && (
        <span key={`out-${g}`} aria-hidden className="digit-out absolute inset-0">
          {previous.current}
        </span>
      )}
      <span key={`in-${g}`} className={`inline-block ${g > 0 ? 'digit-in' : ''}`}>
        {ch}
      </span>
    </span>
  );
}

interface Props {
  amount: number;
  currency: string;
  kind: AmountKind;
  className?: string;
  /** Classes for the currency symbol. Defaults to a muted tone. */
  symbolClassName?: string;
  /** Classes for the decimal separator and fraction digits, e.g. to dim them. */
  fractionClassName?: string;
  /** Animate digits as they change (for the live hero figure). */
  roll?: boolean;
  /** What the amount reveals, for privacy masking. Defaults to the cautious `tuition`. */
  scale?: AmountScale;
}

/** A formatted amount with tabular digits and a quieter currency symbol. */
export function Money({
  amount,
  currency,
  kind,
  className = '',
  symbolClassName = 'text-muted',
  fractionClassName = '',
  roll = false,
  scale = 'tuition',
}: Props) {
  const masked = isMasked(usePrivacy(), scale);
  const parts = moneyParts(amount, currency, kind, locale).filter(
    // Drop the space some locales put between symbol and digits; spacing is styled.
    (p) => !(p.type === 'literal' && p.value.trim() === ''),
  );
  const text = parts.map((p) => p.value).join('');

  // Privacy mode: keep the currency symbol, hide every digit behind a fixed-length mask.
  if (masked) {
    const symbol = parts.find((p) => p.type === 'currency')?.value ?? currency;
    return (
      <span className={`num whitespace-nowrap ${className}`} aria-label={t('amountHidden')}>
        <span className={symbolClassName} aria-hidden>
          {symbol}
        </span>
        <span aria-hidden className="tracking-[0.05em]">
          {MASK}
        </span>
      </span>
    );
  }

  // Characters are keyed by their distance from the right, so slots stay put as the
  // integer part grows (2,999.9 → 3,000.0).
  let fromRight = text.length;
  return (
    <span className={`num whitespace-nowrap ${className}`} aria-label={roll ? text : undefined}>
      {parts.map((p, i) => {
        const cls =
          p.type === 'currency'
            ? symbolClassName
            : p.type === 'decimal' || p.type === 'fraction'
              ? fractionClassName
              : '';
        if (!roll || p.type === 'currency') {
          fromRight -= p.value.length;
          return (
            <span key={i} className={cls}>
              {p.value}
            </span>
          );
        }
        return (
          <span key={i} className={cls} aria-hidden>
            {[...p.value].map((ch) => {
              const key = fromRight--;
              // Fraction digits change faster than the animation, so they just switch.
              return /\d/.test(ch) && p.type === 'integer' ? (
                <RollingChar key={key} ch={ch} />
              ) : (
                <span key={key}>{ch}</span>
              );
            })}
          </span>
        );
      })}
    </span>
  );
}
