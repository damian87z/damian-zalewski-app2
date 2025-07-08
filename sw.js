// Service Worker dla aplikacji DZ Nieruchomości
// Zapewnia funkcjonalność offline i cache'owanie zasobów

const CACHE_NAME = 'dz-nieruchomosci-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/pwa.js',
  '/manifest.json',
  '/images/app-icon.jpg',
  '/images/logo.png',
  '/images/hero-bg.jpg',
  '/images/contact-icon.jpg',
  '/images/calendar-icon.jpg',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Cache complete');
        self.skipWaiting();
      })
      .catch((error) => {
        console.log('Service Worker: Cache failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip chrome-extension requests
  if (event.request.url.startsWith('chrome-extension://')) return;
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return response;
        }
        
        return fetch(event.request).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          // Cache the fetched resource
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        }).catch((error) => {
          console.log('Service Worker: Fetch failed', error);
          
          // Return offline page for navigation requests
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
          
          // Return empty response for other requests
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// Background sync for sending SMS when online
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-sms') {
    console.log('Service Worker: Background sync for SMS');
    event.waitUntil(
      // Here you would implement actual SMS sending logic
      // For now, we'll just log it
      new Promise((resolve) => {
        console.log('Service Worker: SMS sent via background sync');
        resolve();
      })
    );
  }
});

// Push notifications (for future reminder functionality)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Masz nowe powiadomienie',
    icon: '/images/app-icon.jpg',
    badge: '/images/app-icon.jpg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Sprawdź',
        icon: '/images/calendar-icon.jpg'
      },
      {
        action: 'close',
        title: 'Zamknij',
        icon: '/images/app-icon.jpg'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('DZ Nieruchomości', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    // Open the app to meetings section
    event.waitUntil(
      clients.openWindow('/?action=meetings')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle app shortcuts
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Update available notification
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    // Check for updates
    self.registration.update();
  }
});
