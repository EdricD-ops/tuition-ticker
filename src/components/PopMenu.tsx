import { useEffect, useRef, useState, type ReactNode } from 'react';

export interface MenuItem {
  label: string;
  onSelect: () => void;
  /** Shows a check mark: the current choice in a radio-style menu. */
  selected?: boolean;
}

/**
 * A small icon button that opens a list of choices. Closes on outside click, Escape or
 * a pick. `side` is where the list opens relative to the button.
 */
export function PopMenu({
  label,
  icon,
  items,
  side = 'top-start',
}: {
  /** Accessible name and tooltip of the button. */
  label: string;
  icon: ReactNode;
  items: MenuItem[];
  side?: 'top-start' | 'top-end' | 'bottom-end';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const position =
    side === 'top-start'
      ? 'bottom-full left-0 mb-2'
      : side === 'top-end'
        ? 'bottom-full right-0 mb-2'
        : 'top-full right-0 mt-2';

  return (
    <div ref={ref} className="relative">
      <IconButton label={label} onClick={() => setOpen((v) => !v)} active={open} popup>
        {icon}
      </IconButton>
      {open && (
        <div
          role="menu"
          aria-label={label}
          className={`absolute z-30 min-w-40 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-xl [animation:fade_150ms_ease_both] ${position}`}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitemradio"
              aria-checked={!!item.selected}
              onClick={() => {
                setOpen(false);
                item.onSelect();
              }}
              className={`flex w-full items-center justify-between gap-4 px-3.5 py-2 text-left text-[13px] transition-colors hover:bg-raised hover:text-fg ${
                item.selected ? 'text-fg' : 'text-fg-2'
              }`}
            >
              {item.label}
              <span aria-hidden className={item.selected ? 'text-live' : 'invisible'}>
                ✓
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Square, borderless icon button with a tooltip. */
export function IconButton({
  label,
  onClick,
  children,
  active = false,
  popup = false,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  active?: boolean;
  popup?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-haspopup={popup ? 'menu' : undefined}
      aria-expanded={popup ? active : undefined}
      className={`grid size-8 place-items-center rounded-md transition-colors duration-200 hover:bg-raised hover:text-fg ${
        active ? 'bg-raised text-fg' : 'text-muted'
      }`}
    >
      {children}
    </button>
  );
}
