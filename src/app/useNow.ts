import { useEffect, useState } from 'react';

/**
 * Current time, refreshed every animation frame of `target`. Figures are always recomputed
 * from `Date.now()` rather than accumulated, so background-tab throttling cannot make them
 * drift. Pass the always-on-top pop-out window while it is open: its frames keep firing
 * when the main window is minimised or hidden.
 */
export function useNow(target: Window = window): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    let id = 0;
    const tick = () => {
      setNow(Date.now());
      id = target.requestAnimationFrame(tick);
    };
    id = target.requestAnimationFrame(tick);
    return () => target.cancelAnimationFrame(id);
  }, [target]);
  return now;
}
