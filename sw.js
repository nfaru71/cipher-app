/* Cache only the app shell. Keep the cache name versioned when shell files change. */
const CACHE_NAME = 'cipher-shell-v3';
const SCOPE_URL = new URL(self.registration.scope);
const SHELL_URLS = [
  new URL('./', SCOPE_URL).href,
  new URL('index.html', SCOPE_URL).href,
  new URL('style.css', SCOPE_URL).href,
  new URL('app.js', SCOPE_URL).href,
  new URL('manifest.json', SCOPE_URL).href
];
const INDEX_URL = new URL('index.html', SCOPE_URL).href;

function isInScope(url) {
  return url.origin === SCOPE_URL.origin && url.pathname.startsWith(SCOPE_URL.pathname);
}

function shellAsset(url) {
  if (url.origin !== SCOPE_URL.origin || url.search || url.hash) return null;
  return SHELL_URLS.find(asset => new URL(asset).pathname === url.pathname) || null;
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // addAll is atomic: don't install an incomplete shell that cannot run offline.
    await cache.addAll(SHELL_URLS);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith('cipher-shell-') && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (!isInScope(url)) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await fetch(request);
      } catch {
        const cache = await caches.open(CACHE_NAME);
        // HTML fallback is deliberately navigation-only.
        return await cache.match(request) || await cache.match(INDEX_URL) ||
          new Response('Offline page unavailable.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }
    })());
    return;
  }

  const asset = shellAsset(url);
  if (!asset) return; // Never turn arbitrary requests into the app document.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(asset);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok) await cache.put(asset, response.clone());
      return response;
    } catch {
      return new Response('Offline asset unavailable.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }
  })());
});
