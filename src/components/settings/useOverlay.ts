import { useEffect } from 'react';

/**
 * Locks page scroll and closes on Escape while an overlay is open. Nested overlays each
 * register a listener; only the most recently opened one reacts to Escape.
 */
const stack: (() => void)[] = [];

export function useOverlay(onClose: () => void) {
  useEffect(() => {
    stack.push(onClose);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && stack[stack.length - 1] === onClose) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      stack.splice(stack.indexOf(onClose), 1);
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);
}
