const CACHE_NAME = 'fittrack-pro-v1.0.0';
const API_CACHE_NAME = 'fittrack-api-v1.0.0';

// Static assets to cache
const STATIC_ASSETS = [
    '/',
    '/static/js/bundle.js',
    '/static/css/main.css',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[SW] Static assets cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Failed to cache static assets:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] Service worker activated');
                return self.clients.claim();
            })
    );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Handle API requests
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(request));
        return;
    }

    // Handle static assets
    if (isStaticAsset(request)) {
        event.respondWith(handleStaticAsset(request));
        return;
    }

    // Handle navigation requests (SPA routing)
    if (request.mode === 'navigate') {
        event.respondWith(handleNavigation(request));
        return;
    }
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
    const cache = await caches.open(API_CACHE_NAME);

    try {
        // Try network first
        const networkResponse = await fetch(request);

        if (networkResponse.ok) {
            // Cache successful responses
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('[SW] Network failed, trying cache for:', request.url);

        // Fallback to cache
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        // Return offline fallback for specific endpoints
        return createOfflineFallback(request);
    }
}

// Handle static assets with cache-first strategy
async function handleStaticAsset(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        cache.put(request, networkResponse.clone());
        return networkResponse;
    } catch (error) {
        console.error('[SW] Failed to fetch static asset:', request.url);
        throw error;
    }
}

// Handle navigation requests (SPA)
async function handleNavigation(request) {
    const cache = await caches.open(CACHE_NAME);

    try {
        // Try network first for navigation
        const networkResponse = await fetch(request);
        return networkResponse;
    } catch (error) {
        // Fallback to cached index.html for SPA routing
        const fallbackResponse = await cache.match('/');
        return fallbackResponse || Response.error();
    }
}

// Check if request is for a static asset
function isStaticAsset(request) {
    const url = new URL(request.url);

    return (
        url.pathname.startsWith('/static/') ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.jpg') ||
        url.pathname.endsWith('.svg') ||
        url.pathname.includes('fonts.googleapis.com')
    );
}

// Create offline fallback responses
function createOfflineFallback(request) {
    const url = new URL(request.url);

    if (url.pathname.includes('/workouts')) {
        return new Response(JSON.stringify({
            success: true,
            data: [],
            offline: true,
            message: 'Showing cached data - you are offline'
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    if (url.pathname.includes('/stats')) {
        return new Response(JSON.stringify({
            success: true,
            data: {
                totalWorkouts: 0,
                recentWorkouts: 0,
                totalVolume: 0,
                averageDuration: 0
            },
            offline: true
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({
        success: false,
        error: 'You are offline and this data is not cached',
        offline: true
    }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
    });
}

// Background sync for offline saves
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync triggered:', event.tag);

    if (event.tag === 'workout-sync') {
        event.waitUntil(syncOfflineWorkouts());
    }

    if (event.tag === 'measurement-sync') {
        event.waitUntil(syncOfflineMeasurements());
    }
});

// Sync offline workouts when back online
async function syncOfflineWorkouts() {
    try {
        const offlineWorkouts = await getOfflineData('pendingWorkouts');

        for (const workout of offlineWorkouts) {
            try {
                const response = await fetch('/api/v1/workouts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${workout.token}`
                    },
                    body: JSON.stringify(workout.data)
                });

                if (response.ok) {
                    await removeOfflineData('pendingWorkouts', workout.id);
                    console.log('[SW] Synced offline workout:', workout.id);
                }
            } catch (error) {
                console.error('[SW] Failed to sync workout:', error);
            }
        }
    } catch (error) {
        console.error('[SW] Background sync failed:', error);
    }
}

// Push notification handling
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received');

    if (!event.data) {
        return;
    }

    const data = event.data.json();

    const options = {
        body: data.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        data: data.data || {},
        actions: [
            {
                action: 'open',
                title: 'Open App'
            },
            {
                action: 'dismiss',
                title: 'Dismiss'
            }
        ],
        requireInteraction: true,
        vibrate: [200, 100, 200]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.action);

    event.notification.close();

    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);

    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});

console.log('[SW] Service worker script loaded');