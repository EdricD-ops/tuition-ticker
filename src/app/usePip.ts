import { useCallback, useEffect, useState } from 'react';

/** Document Picture-in-Picture (Chrome / Edge desktop). Not yet in TypeScript's DOM lib. */
interface DocumentPictureInPicture extends EventTarget {
  requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
  readonly window: Window | null;
}

declare global {
  interface Window {
    documentPictureInPicture?: DocumentPictureInPicture;
  }
}

/**
 * Default size of the always-on-top window, in CSS pixels; Chrome takes its title bar out
 * of the height. Users can resize it.
 */
export const PIP_SIZE = { width: 400, height: 240 } as const;

export const pipSupported = (): boolean =>
  typeof window !== 'undefined' && 'documentPictureInPicture' in window && window.isSecureContext;

/** Copies the page's styles and theme attributes into the pop-out document. */
function mirrorDocument(target: Window): void {
  const doc = target.document;
  for (const node of document.querySelectorAll('link[rel="stylesheet"], style')) {
    doc.head.appendChild(node.cloneNode(true));
  }
  for (const attr of document.documentElement.attributes) {
    doc.documentElement.setAttribute(attr.name, attr.value);
  }
  doc.title = document.title;
}

/**
 * Opens and tracks an always-on-top pop-out window. Render into `win.document.body` with a
 * portal; the window closes itself when the user closes it or the page goes away.
 */
export function usePip() {
  const [win, setWin] = useState<Window | null>(null);

  const open = useCallback(async () => {
    const api = window.documentPictureInPicture;
    if (!api) return;
    try {
      const w = await api.requestWindow(PIP_SIZE);
      mirrorDocument(w);
      w.addEventListener('pagehide', () => setWin(null), { once: true });
      setWin(w);
    } catch (err) {
      // Needs a user gesture, and some embedded browsers refuse new windows outright.
      console.warn('Could not open the pop-out window:', err);
    }
  }, []);

  const close = useCallback(() => {
    win?.close();
    setWin(null);
  }, [win]);

  // The pop-out belongs to this component instance (the app remounts on a language
  // switch): close it on unmount rather than leave an empty window behind.
  useEffect(() => () => win?.close(), [win]);

  // Keep the pop-out's light/dark theme in step with the page.
  useEffect(() => {
    if (!win) return;
    const sync = new MutationObserver(() => {
      const theme = document.documentElement.getAttribute('data-theme');
      if (theme) win.document.documentElement.setAttribute('data-theme', theme);
      else win.document.documentElement.removeAttribute('data-theme');
    });
    sync.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => sync.disconnect();
  }, [win]);

  return { supported: pipSupported(), win, open, close };
}
