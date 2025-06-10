const CACHE_NAME = 'mealappeal-v1'

// Assets to cache
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
]

// Install service worker and cache precache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  )
})

// Clean up old caches on activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

// Network-first strategy with fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // Skip Supabase API requests
  if (event.request.url.includes('supabase.co')) return

  // Skip Next.js build files and webpack chunks to prevent ChunkLoadError
  if (event.request.url.includes('/_next/') || 
      event.request.url.includes('.js') ||
      event.request.url.includes('.css') ||
      event.request.url.includes('chunk') ||
      event.request.url.includes('webpack') ||
      event.request.url.includes('hot-update')) {
    // Let Next.js handle these files directly
    return
  }

  // Skip API routes
  if (event.request.url.includes('/api/')) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response before caching
        const responseToCache = response.clone()

        // Only cache successful responses for specific file types
        if (response.status === 200 && 
            (event.request.url.includes('.png') ||
             event.request.url.includes('.jpg') ||
             event.request.url.includes('.jpeg') ||
             event.request.url.includes('.svg') ||
             event.request.url.includes('.ico') ||
             event.request.headers.get('accept')?.includes('text/html'))) {
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache)
            })
        }

        return response
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request)
          .then((response) => {
            if (response) {
              return response
            }
            
            // Return offline fallback for HTML requests
            if (event.request.headers.get('accept')?.includes('text/html')) {
              return caches.match('/offline.html')
            }
            
            return new Response('Network error happened', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' },
            })
          })
      })
  )
})

// Handle push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  }

  event.waitUntil(
    self.registration.showNotification('MealAppeal', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(
    clients.openWindow('/')
  )
}) 