// Service worker cache-first. Il segnaposto versione viene sostituito da scripts/stamp.mjs.
const VERSION = '20261112-1417';
const CACHE = 'kingsgate-' + VERSION;

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  // La pagina (index.html) prima dalla rete, cosi' le nuove versioni arrivano subito; il resto cache-first.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match(req).then((h) => h || caches.match('./index.html'))));
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => undefined);
        }
        return res;
      });
    })
  );
});
