import { useEffect, useState } from 'react';
import { isFresh, type RateTable } from '../core';
import { fetchRateTable, readCachedRates, writeCachedRates } from './rates';

export interface RateState {
  table: RateTable | null;
  /** False while showing a table from an earlier visit because refreshing it failed. */
  current: boolean;
  /** A request is in flight and there is nothing usable yet. */
  loading: boolean;
}

/** One request per base currency at a time, shared by every component that asks. */
const inFlight = new Map<string, Promise<RateTable | null>>();

function refresh(base: string): Promise<RateTable | null> {
  let p = inFlight.get(base);
  if (!p) {
    p = fetchRateTable(base)
      .then((table) => {
        if (table) writeCachedRates(table);
        return table;
      })
      .finally(() => inFlight.delete(base));
    inFlight.set(base, p);
  }
  return p;
}

function initial(base: string | null): RateState {
  const table = base ? readCachedRates(base) : null;
  const current = !!table && isFresh(table, Date.now());
  return { table, current, loading: !!base && !current };
}

/** How often an open page checks whether its cached rates have gone stale. */
const CHECK_EVERY_MS = 30 * 60 * 1000;

/**
 * Daily reference rates for `base`, from the local cache first and the network when the
 * cache is missing or stale. Pass null to skip (conversion off). Offline, the last cached
 * table keeps working and is reported as not current.
 */
export function useRates(base: string | null): RateState {
  const [state, setState] = useState<RateState>(() => initial(base));
  const [prevBase, setPrevBase] = useState(base);
  if (prevBase !== base) {
    setPrevBase(base);
    setState(initial(base));
  }

  useEffect(() => {
    if (!base) return;
    let alive = true;
    const update = () => {
      const cached = readCachedRates(base);
      if (cached && isFresh(cached, Date.now())) {
        setState({ table: cached, current: true, loading: false });
        return;
      }
      void refresh(base).then((table) => {
        if (!alive) return;
        setState(
          table
            ? { table, current: true, loading: false }
            : { table: readCachedRates(base), current: false, loading: false },
        );
      });
    };
    update();
    const id = setInterval(update, CHECK_EVERY_MS);
    window.addEventListener('online', update);
    return () => {
      alive = false;
      clearInterval(id);
      window.removeEventListener('online', update);
    };
  }, [base]);

  return state;
}
