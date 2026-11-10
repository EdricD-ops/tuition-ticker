import type { CSSProperties, ReactNode } from 'react';

export function ProgressBar({
  value,
  tone = 'fg',
  className = '',
  animateIn = false,
}: {
  value: number;
  tone?: 'fg' | 'bar';
  className?: string;
  /** Grow from zero on mount. */
  animateIn?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, value * 100));
  return (
    <div className={`h-[3px] w-full overflow-hidden rounded-full bg-track ${className}`}>
      <div
        className={`h-full rounded-full ${tone === 'bar' ? 'bg-bar' : 'bg-fg'} ${animateIn ? 'grow' : ''}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Bordered card with an optional serif title and eyebrow tag. */
export function Panel({
  title,
  tag,
  children,
  className = '',
  style,
}: {
  title?: string;
  tag?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <section
      className={`rounded-xl border border-line bg-surface ${className}`}
      style={style}
    >
      {title && (
        <header className="flex items-center justify-between gap-3 px-5 pt-4 pb-2 sm:px-6">
          <h2 className="font-serif text-[22px] leading-tight tracking-[-0.01em]">{title}</h2>
          {tag}
        </header>
      )}
      {children}
    </section>
  );
}

/** Label on the left, figure on the right, hairline between rows. */
export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-line px-5 py-3 first:border-t-0 sm:px-6">
      <span className="truncate text-sm text-fg-2">{label}</span>
      <span className="num shrink-0 text-[17px] font-medium tracking-tight">{children}</span>
    </div>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-md border border-line px-1.5 py-0.5 font-mono text-[10px] tracking-[0.1em] text-muted uppercase">
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  variant = 'ghost',
  disabled,
  title,
  className = '',
  pressed,
  ariaHasPopup = false,
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  title?: string;
  className?: string;
  /** Toggle buttons: shows the "on" look and sets aria-pressed. */
  pressed?: boolean;
  ariaHasPopup?: boolean;
  ariaLabel?: string;
}) {
  const style =
    variant === 'primary'
      ? 'bg-fg text-bg hover:opacity-90'
      : pressed
        ? 'border border-fg/30 bg-raised text-fg'
        : 'border border-line text-fg-2 hover:bg-raised hover:text-fg';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      aria-pressed={ariaHasPopup ? undefined : pressed}
      aria-expanded={ariaHasPopup ? pressed : undefined}
      aria-haspopup={ariaHasPopup ? 'menu' : undefined}
      className={`h-8 shrink-0 rounded-md px-3 text-[13px] font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${style} ${className}`}
    >
      {children}
    </button>
  );
}

/** Pulsing live dot. */
export function LiveDot({ on = true }: { on?: boolean }) {
  return (
    <span className="relative inline-flex size-2 shrink-0">
      {on && <span className="absolute inset-0 animate-ping rounded-full bg-live opacity-60" />}
      <span className={`relative size-2 rounded-full ${on ? 'bg-live' : 'bg-muted'}`} />
    </span>
  );
}

/** Staggered entrance: pass the item's order. */
export const riseStyle = (order: number): CSSProperties => ({ animationDelay: `${order * 70}ms` });

export const pct = (v: number) => `${(Math.min(1, Math.max(0, v)) * 100).toFixed(1)}%`;
