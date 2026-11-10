/* Tuition Ticker service worker. Generated at build time; see vite.config.ts. */
/* global self, caches, fetch, URL, Response */
const VERSION = '__VERSION__';
const PRECACHE = __PRECACHE__;
const CACHE = `tuition-ticker-${VERSION}`;
const scope = new URL(self.registration.scope);
const toUrl = (path) => new URL(path, scope).href;
const INDEX = toUrl('index.html');

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE.map(toUrl)))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k.startsWith('tuition-ticker-') && k !== CACHE).map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Exchange-rate APIs and anything else off-site go straight to the network; rates have
  // their own cache in localStorage.
  if (url.origin !== scope.origin) return;

  if (request.mode === 'navigate') {
    // Network first so a new version shows up on the next load; offline, serve the shell.
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(INDEX, copy));
          }
          return res;
        })
        .catch(() =>
          caches.match(INDEX, { ignoreVary: true }).then((hit) => hit || new Response('Offline', { status: 503 })),
        ),
    );
    return;
  }

  // Hashed assets never change: cache first, and keep anything new for next time.
  event.respondWith(
    // ignoreVary: servers may send `Vary: Origin`, and module scripts carry an Origin
    // header that the precache requests did not, which would otherwise miss the cache.
    caches.match(request, { ignoreVary: true }).then(
      (hit) =>
        hit ||
        fetch(request).then((res) => {
          if (res.ok && res.type === 'basic') {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        }),
    ),
  );
});
