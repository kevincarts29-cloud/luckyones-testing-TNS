const CACHE_NAME = 'technova-cache-v2';
const OFFLINE_URL = '/offline.html';

const urlsToCache = [
  '/',
  '/index.html',
  '/404.html',
  '/offline.html',
  '/assets/css/variables.css',
  '/assets/css/styles.css',
  '/assets/css/animations.css',
  '/assets/img/logo.svg',
  '/assets/icons/favicon.svg',
  '/js/main.js',
  '/pages/products.html',
  '/pages/services.html',
  '/pages/pricing.html',
  '/pages/solutions.html',
  '/pages/partners.html',
  '/pages/about.html',
  '/pages/blog.html',
  '/privacy-policy.html',
  '/terms.html'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names.map(name => (name === CACHE_NAME ? null : caches.delete(name)))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;

  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Page requests: network first so content stays current, fall back to cache,
  // then to the offline page.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy));
          return res;
        })
        .catch(() =>
          caches.match(req).then(hit => hit || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // Images from the CDN: serve from cache when we have them, otherwise fetch.
  if (req.destination === 'image') {
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).catch(() => hit))
    );
    return;
  }

  // Local assets: cache first, they are versioned with the cache name.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req))
    );
  }
});