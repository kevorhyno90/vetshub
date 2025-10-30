self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open('pwa-simple-app-cache').then((cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                '/src/main.js',
                '/src/styles.css',
                '/manifest.json'
            ]);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).catch(() => {
                // fallback for navigation requests: return cached index.html
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            });
        })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = ['pwa-simple-app-cache'];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});