const CACHE_NAME = 'pwa-simple-app-cache-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/src/main.js',
    '/src/styles.css',
    '/manifest.json',
    '/assets/icons/icon-192x192.png',
    '/assets/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
    // Use skipWaiting so the new SW activates as soon as it's installed.
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE).catch(() => {
            // ignore failures to cache optional assets
            return Promise.resolve();
        }))
    );
});

self.addEventListener('activate', (event) => {
    // Claim clients so the SW takes control immediately, and clear old caches.
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => { if (k !== CACHE_NAME) return caches.delete(k); }));
        await self.clients.claim();
    })());
});

self.addEventListener('fetch', (event) => {
    // For navigation requests, prefer network but fallback to cache (network-first for SPA updates).
    if (event.request.mode === 'navigate') {
        event.respondWith((async () => {
            try {
                const networkResp = await fetch(event.request);
                const cache = await caches.open(CACHE_NAME);
                // update cached index.html for future navigations
                cache.put('/index.html', networkResp.clone()).catch(() => {});
                return networkResp;
            } catch (err) {
                const cached = await caches.match('/index.html');
                return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
            }
        })());
        return;
    }

    // For other requests, try cache first then network.
    event.respondWith(caches.match(event.request).then((resp) => resp || fetch(event.request)));
});