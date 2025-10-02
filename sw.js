// Service Worker for Smart Display Hub
const CACHE_NAME = 'smart-display-v10';
const CACHE_ASSETS = [
    '/',
    '/index.html',
    '/styles/main.css',
    '/styles/tiles.css', 
    '/styles/themes.css',
    '/js/app.js',
    '/js/tiles/calendar.js',
    '/js/tiles/todo.js',
    '/js/tiles/weather.js',
    '/js/tiles/time.js',
    '/js/tiles/countdown.js',
    '/js/tiles/timer.js',
    '/js/tiles/traffic.js',
    '/js/tiles/birthday.js',
    '/js/layout.js',
    '/js/settings.js',
    '/js/themes.js',
    '/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(CACHE_ASSETS);
            })
            .catch(err => console.log('Service Worker: Cache failed', err))
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
    
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;
    
    // Skip external requests (APIs)
    if (!event.request.url.startsWith(self.location.origin)) {
        // For external APIs, use network first, then show offline message
        event.respondWith(
            fetch(event.request).catch(() => {
                return new Response(
                    JSON.stringify({
                        error: 'Offline',
                        message: 'This feature requires an internet connection'
                    }),
                    {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            })
        );
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
            .catch(() => {
                // If both cache and network fail, return offline page
                if (event.request.destination === 'document') {
                    return caches.match('/index.html');
                }
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {

    if (event.tag === 'background-sync-tasks') {
        event.waitUntil(syncTasks());
    } else if (event.tag === 'background-sync-events') {
        event.waitUntil(syncEvents());
    }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {

    event.notification.close();
    
    // Focus or open the app
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then(clientList => {
                // If app is already open, focus it
                for (const client of clientList) {
                    if (client.url === self.location.origin && 'focus' in client) {
                        return client.focus();
                    }
                }
                
                // Otherwise open new window
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
    );
});

// Push notification handling
self.addEventListener('push', (event) => {
    
    const options = {
        body: event.data ? event.data.text() : 'New notification from Smart Display Hub',
        icon: '/assets/icon-192.png',
        badge: '/assets/badge.png',
        tag: 'smart-display-hub',
        requireInteraction: false,
        actions: [
            {
                action: 'view',
                title: 'View',
                icon: '/assets/action-view.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/assets/action-dismiss.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Smart Display Hub', options)
    );
});

// Message handling from main app
self.addEventListener('message', (event) => {
    
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'SKIP_WAITING':
                self.skipWaiting();
                break;
            case 'CACHE_URLS':
                cacheUrls(event.data.urls);
                break;
            case 'CLEAR_CACHE':
                clearCache();
                break;
        }
    }
});

// Utility functions
async function syncTasks() {
    try {
        // Get pending tasks from IndexedDB or localStorage
        const pendingTasks = await getPendingTasks();
        
        for (const task of pendingTasks) {
            try {
                // Attempt to sync with external service
                await syncTaskToService(task);
                // Remove from pending queue on success
                await removePendingTask(task.id);
            } catch (error) {
                console.warn('Failed to sync task:', task.id, error);
            }
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

async function syncEvents() {
    try {
        // Similar to syncTasks but for calendar events
        const pendingEvents = await getPendingEvents();
        
        for (const event of pendingEvents) {
            try {
                await syncEventToService(event);
                await removePendingEvent(event.id);
            } catch (error) {
                console.warn('Failed to sync event:', event.id, error);
            }
        }
    } catch (error) {
        console.error('Background sync failed:', error);
    }
}

async function cacheUrls(urls) {
    const cache = await caches.open(CACHE_NAME);
    try {
        await cache.addAll(urls);
        console.log('Service Worker: Additional URLs cached');
    } catch (error) {
        console.warn('Service Worker: Failed to cache URLs', error);
    }
}

async function clearCache() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('Service Worker: All caches cleared');
    } catch (error) {
        console.error('Service Worker: Failed to clear cache', error);
    }
}

// Placeholder functions for external service integration
async function getPendingTasks() {
    // Implementation would depend on storage mechanism
    return [];
}

async function syncTaskToService(task) {
    // Implementation would sync with Todoist, Microsoft To Do, etc.
    throw new Error('Not implemented');
}

async function removePendingTask(taskId) {
    // Remove from pending queue
}

async function getPendingEvents() {
    return [];
}

async function syncEventToService(event) {
    // Implementation would sync with Google Calendar, Outlook, etc.
    throw new Error('Not implemented');
}

async function removePendingEvent(eventId) {
    // Remove from pending queue
}

// Periodic background fetch (if supported)
if ('serviceWorker' in navigator && 'periodicSync' in window.ServiceWorkerRegistration.prototype) {
    self.addEventListener('periodicsync', (event) => {
        
        if (event.tag === 'weather-update') {
            event.waitUntil(updateWeatherData());
        } else if (event.tag === 'traffic-update') {
            event.waitUntil(updateTrafficData());
        }
    });
}

async function updateWeatherData() {
    // Update weather data in background
    try {
        const settings = JSON.parse(localStorage.getItem('smartDisplayHub_weatherSettings') || '{}');
        if (settings.apiKey && settings.location) {
            // Fetch weather data and cache it
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(settings.location)}&appid=${settings.apiKey}&units=${settings.units || 'metric'}`;
            const response = await fetch(url);
            const data = await response.json();
            
            // Store in cache or send to main app
            const cache = await caches.open(CACHE_NAME);
            cache.put('/api/weather', new Response(JSON.stringify(data)));
        }
    } catch (error) {
        console.warn('Background weather update failed:', error);
    }
}

async function updateTrafficData() {
    // Update traffic data in background
    try {
        const settings = JSON.parse(localStorage.getItem('smartDisplayHub_trafficSettings') || '{}');
        if (settings.apiKey && settings.routes && settings.routes.length > 0) {
            // Update traffic for each route
            for (const route of settings.routes) {
                const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(route.origin)}&destinations=${encodeURIComponent(route.destination)}&departure_time=now&traffic_model=best_guess&key=${settings.apiKey}`;
                
                try {
                    const response = await fetch(url);
                    const data = await response.json();
                    
                    // Cache the result
                    const cache = await caches.open(CACHE_NAME);
                    cache.put(`/api/traffic/${route.id}`, new Response(JSON.stringify(data)));
                } catch (error) {
                    console.warn(`Failed to update traffic for route ${route.id}:`, error);
                }
            }
        }
    } catch (error) {
        console.warn('Background traffic update failed:', error);
    }
}