/** Small line icons on a 24px grid. They inherit `currentColor` and size from className. */
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export function GlobeIcon({ className = 'size-[18px]' }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17" />
      <path d="M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5S9.7 5.9 12 3.5Z" />
    </svg>
  );
}

export function MoonIcon({ className = 'size-[18px]' }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10Z" />
    </svg>
  );
}

/** A small window inside a larger one: the compact (mini) view. */
export function MiniIcon({ className = 'size-[18px]' }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <rect x="12" y="12" width="6.5" height="5" rx="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FullscreenIcon({ exit = false, className = 'size-[18px]' }: { exit?: boolean; className?: string }) {
  return (
    <svg {...base} className={className}>
      {exit ? (
        <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
      ) : (
        <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
      )}
    </svg>
  );
}

/** A cup with steam: the "buy me a coffee" link. */
export function CoffeeIcon({ className = 'size-[18px]' }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <path d="M4.5 10h12v4.5a5 5 0 0 1-5 5h-2a5 5 0 0 1-5-5V10Z" />
      <path d="M16.5 11.5h1.25a2.25 2.25 0 0 1 0 4.5H16" />
      <path d="M8.5 3.5c-.6.8-.6 1.7 0 2.5M12 3.5c-.6.8-.6 1.7 0 2.5" />
    </svg>
  );
}
