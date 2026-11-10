/** Brand mark: a rising ticker line inside a rounded square. */
export function LogoMark({ className = 'size-7 shrink-0 text-fg sm:size-8' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="1.5" y="1.5" width="29" height="29" rx="8" strokeWidth="1.5" opacity="0.35" />
      <path d="M7 21 L12.5 15.5 L17 18.5 L24.5 10.5" />
      <circle cx="24.5" cy="10.5" r="2" fill="currentColor" stroke="none" className="text-live" />
    </svg>
  );
}
