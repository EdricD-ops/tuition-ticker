/** Which layout the page shows. `?view=mini` opens the compact widget directly. */
export type View = 'full' | 'mini';

export function readView(search = typeof location === 'undefined' ? '' : location.search): View {
  return new URLSearchParams(search).get('view') === 'mini' ? 'mini' : 'full';
}

/** URL for `view`, keeping every other query parameter and the hash. */
export function viewUrl(view: View, href: string): string {
  const url = new URL(href);
  if (view === 'mini') url.searchParams.set('view', 'mini');
  else url.searchParams.delete('view');
  return url.toString();
}

/** Switches the address bar without reloading, so reloads and bookmarks keep the view. */
export function writeView(view: View): void {
  try {
    history.replaceState(history.state, '', viewUrl(view, location.href));
  } catch {
    // Sandboxed frames may refuse history changes; the in-memory view still switches.
  }
}
