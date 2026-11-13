import { StrictMode, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { subscribeLang, uiLang } from './app/i18n';
import './app/theme';

/** Remounts the app when the language changes, so every memoised string is rebuilt. */
function Root() {
  const current = useSyncExternalStore(subscribeLang, () => uiLang);
  return <App key={current} />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);

// Offline support and "install as app". Development keeps the network-only behaviour.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // Unsupported context (e.g. file://) or blocked: the page works without it.
    });
  });
}
