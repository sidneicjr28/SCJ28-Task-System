// SCJ28 Progressive Web App - Service Worker
const CACHE_NAME = 'scj28-v0.1';

const STATIC_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './SCJ28-square.png',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './js/app.js',
  './js/services/apiService.js',
  './js/services/notificationService.js',
  './js/services/pwaService.js',
  './js/state/store.js',
  './js/ui/modalManager.js',
  './js/ui/toast.js',
  './js/renderers/calendarRenderer.js',
  './js/renderers/categoryRenderer.js',
  './js/renderers/kanbanRenderer.js',
  './js/renderers/listRenderer.js',
  './js/renderers/statsRenderer.js',
  'https://unpkg.com/lucide@latest'
];

// Service Worker Installation: Pre-cache App Shell Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[PWA SW] Pre-caching application shell...');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Service Worker Activation: Clean up old cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[PWA SW] Removing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Strategy:
// 1. API Calls (/api/): Network-first with Cache fallback
// 2. Static Assets: Cache-first with Network fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API handling strategy: Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback for GET API calls if available in cache
          if (event.request.method === 'GET') {
            return caches.match(event.request);
          }
        })
    );
    return;
  }

  // Static Assets Strategy: Cache First, fallback to Network
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version and refresh cache in background
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {/* Offline, silence background update error */});

        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    })
  );
});
