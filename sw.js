// Service Worker for GSJA Ekklesia Room Booking
// Handles push notifications and offline caching

const CACHE_NAME = 'gsja-booking-v1';
const urlsToCache = [
  './',
  './index.html'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Try to cache but don't fail if files don't exist
        return cache.addAll(urlsToCache).catch(err => {
          console.log('Some resources failed to cache, but that\'s OK:', err);
        });
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  let data = {
    title: 'GSJA Ekklesia Booking',
    body: 'New booking notification'
  };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    // Don't include icon/badge paths - they don't exist
    vibrate: [200, 100, 200],
    tag: data.tag || 'booking-notification',
    requireInteraction: false,
    data: data
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('./')
  );
});

// Background sync for offline bookings (future feature)
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncBookings());
  }
});

async function syncBookings() {
  // Placeholder for future offline sync functionality
  console.log('Syncing bookings...');
  return Promise.resolve();
}

console.log('Service Worker loaded successfully!');
