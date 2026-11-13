import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';

const CONTROL =
  'h-10 w-full min-w-0 rounded-md border bg-bg px-3 text-sm text-fg outline-none transition-colors duration-150 placeholder:text-muted/70 focus:border-fg/40';

export function Field({
  label,
  hint,
  error,
  children,
  className = '',
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="text-[13px] font-medium text-fg-2">{label}</span>
      <div className="mt-1.5">{children}</div>
      {error ? (
        <span className="mt-1.5 block text-xs text-red-500">{error}</span>
      ) : (
        hint && <span className="mt-1.5 block text-xs text-muted">{hint}</span>
      )}
    </label>
  );
}

export function TextInput({
  invalid,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...props}
      className={`${CONTROL} ${invalid ? 'border-red-500/70' : 'border-line'} ${className}`}
    />
  );
}

/** Numeric input that reports a number (NaN while empty) and keeps tabular digits. */
export function NumberInput({
  value,
  onValue,
  invalid,
  className = '',
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> & {
  value: number;
  onValue: (n: number) => void;
  invalid?: boolean;
}) {
  return (
    <input
      {...props}
      type="number"
      inputMode="decimal"
      value={Number.isFinite(value) && value !== 0 ? value : ''}
      onChange={(e) => onValue(e.target.value === '' ? 0 : Number(e.target.value))}
      className={`${CONTROL} num font-mono ${invalid ? 'border-red-500/70' : 'border-line'} ${className}`}
    />
  );
}

export function Select({
  className = '',
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`${CONTROL} border-line pr-8 ${className}`}>
      {children}
    </select>
  );
}

export function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-4">
      <h3 className="font-title text-2xl leading-tight">{title}</h3>
      {hint && <p className="mt-1 text-[13px] text-muted">{hint}</p>}
    </div>
  );
}

/** Small text-style button for secondary actions inside forms. */
export function LinkButton({
  children,
  onClick,
  tone = 'muted',
  className = '',
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: 'muted' | 'danger';
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[13px] transition-colors ${
        tone === 'danger' ? 'text-muted hover:text-red-500' : 'text-fg-2 hover:text-fg'
      } ${className}`}
    >
      {children}
    </button>
  );
}
