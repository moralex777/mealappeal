// MealAppeal Service Worker - Comprehensive PWA Implementation
// Version 2.0.0

const CACHE_NAME = 'mealappeal-v2'
const STATIC_CACHE = 'mealappeal-static-v2'
const DYNAMIC_CACHE = 'mealappeal-dynamic-v2'
const IMAGE_CACHE = 'mealappeal-images-v2'
const API_CACHE = 'mealappeal-api-v2'

// Background sync tags
const SYNC_TAGS = {
  uploadMeal: 'upload-meal',
  analyzeFood: 'analyze-food',
  syncMeals: 'sync-meals'
}

// Assets to cache
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/camera',
  '/meals',
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png'
]

// Install service worker and cache precache assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker v2 installing...')
  
  event.waitUntil(
    Promise.all([
      // Cache essential static resources
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(PRECACHE_ASSETS).catch(err => {
          console.error('Failed to cache precache assets:', err)
        })
      }),
      
      // Initialize IndexedDB for offline storage
      initializeOfflineDB()
    ]).then(() => {
      console.log('✅ Service Worker v2 installed successfully')
      return self.skipWaiting()
    })
  )
})

// Clean up old caches on activation
self.addEventListener('activate', (event) => {
  console.log('🎯 Service Worker v2 activating...')
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter(cacheName => 
              cacheName.startsWith('mealappeal-') && 
              ![CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE, API_CACHE].includes(cacheName)
            )
            .map((cacheName) => {
              console.log('🗑️ Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            })
        )
      }),
      
      // Claim all clients
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Service Worker v2 activated successfully')
    })
  )
})

// Enhanced fetch handler with advanced caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests and chrome extensions
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return
  }
  
  // Skip Supabase realtime connections
  if (request.url.includes('supabase.co') && request.url.includes('realtime')) {
    return
  }
  
  // Handle different types of requests with appropriate strategies
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request))
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticRequest(request))
  } else {
    event.respondWith(handlePageRequest(request))
  }
})

// Background sync for offline uploads
self.addEventListener('sync', event => {
  console.log('🔄 Background sync triggered:', event.tag)
  
  switch (event.tag) {
    case SYNC_TAGS.uploadMeal:
      event.waitUntil(syncPendingUploads())
      break
    case SYNC_TAGS.analyzeFood:
      event.waitUntil(syncPendingAnalyses())
      break
    case SYNC_TAGS.syncMeals:
      event.waitUntil(syncMealData())
      break
    default:
      console.log('Unknown sync tag:', event.tag)
  }
})

// Enhanced push notification handler
self.addEventListener('push', (event) => {
  console.log('📱 Push notification received')
  
  const options = {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'View Meals',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'camera',
        title: 'Take Photo',
        icon: '/icons/icon-72x72.png'
      }
    ]
  }
  
  if (event.data) {
    const data = event.data.json()
    
    event.waitUntil(
      self.registration.showNotification(
        data.title || 'MealAppeal',
        {
          body: data.body || 'New notification from MealAppeal',
          data: data.url ? { url: data.url } : undefined,
          ...options
        }
      )
    )
  } else {
    // Default meal reminder notification
    event.waitUntil(
      self.registration.showNotification(
        'Time to log your meal! 🍽️',
        {
          body: 'Don\'t forget to capture your delicious meal with AI analysis.',
          data: { url: '/camera' },
          ...options
        }
      )
    )
  }
})

// Enhanced notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action)
  
  event.notification.close()
  
  const urlToOpen = event.action === 'camera' 
    ? '/camera'
    : event.action === 'view'
    ? '/meals'
    : event.notification.data?.url || '/'
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clients => {
        // Check if app is already open
        for (const client of clients) {
          if (client.url.includes(self.location.origin)) {
            client.focus()
            if ('navigate' in client) {
              client.navigate(urlToOpen)
            } else {
              client.postMessage({ type: 'navigate', url: urlToOpen })
            }
            return
          }
        }
        
        // Open new window
        return self.clients.openWindow(urlToOpen)
      })
  )
})

// Message handler for communication with main app
self.addEventListener('message', event => {
  const { type, data } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
    case 'QUEUE_UPLOAD':
      queueOfflineUpload(data)
      break
    case 'CHECK_SYNC':
      checkPendingSyncs().then(count => {
        event.ports[0].postMessage({ pendingCount: count })
      })
      break
    default:
      console.log('Unknown message type:', type)
  }
})

// Helper functions

// Initialize IndexedDB for offline storage
async function initializeOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MealAppealOffline', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = event => {
      const db = event.target.result
      
      // Store for pending uploads
      if (!db.objectStoreNames.contains('pendingUploads')) {
        const uploadStore = db.createObjectStore('pendingUploads', { 
          keyPath: 'id', 
          autoIncrement: true 
        })
        uploadStore.createIndex('timestamp', 'timestamp')
      }
      
      // Store for cached meals
      if (!db.objectStoreNames.contains('cachedMeals')) {
        const mealStore = db.createObjectStore('cachedMeals', { 
          keyPath: 'id' 
        })
        mealStore.createIndex('created_at', 'created_at')
        mealStore.createIndex('user_id', 'user_id')
      }
      
      // Store for offline images
      if (!db.objectStoreNames.contains('offlineImages')) {
        const imageStore = db.createObjectStore('offlineImages', { 
          keyPath: 'url' 
        })
        imageStore.createIndex('timestamp', 'timestamp')
      }
    }
  })
}

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url)
  
  // Skip Supabase auth and storage requests
  if (url.hostname.includes('supabase.co')) {
    return fetch(request)
  }
  
  try {
    // Try network first
    const networkResponse = await fetch(request)
    
    // Cache successful GET responses for meals and profiles
    if (networkResponse.ok && (url.pathname.includes('/meals') || url.pathname.includes('/profile'))) {
      const cache = await caches.open(API_CACHE)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
    
  } catch (error) {
    console.log('Network failed for API request, trying cache:', url.pathname)
    
    // Fallback to cache
    const cache = await caches.open(API_CACHE)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline data for meals endpoint
    if (url.pathname.includes('/meals')) {
      const offlineMeals = await getOfflineMeals()
      return new Response(
        JSON.stringify({ meals: offlineMeals, offline: true }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200
        }
      )
    }
    
    // Generic offline response
    return new Response(
      JSON.stringify({ error: 'Offline - data not available', offline: true }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 503
      }
    )
  }
}

// Handle image requests with cache-first strategy
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Try network
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
    
  } catch (error) {
    console.log('Failed to load image, using fallback')
    
    // Try to find a placeholder image in cache
    const cache = await caches.open(STATIC_CACHE)
    const placeholderResponse = await cache.match('/placeholder-meal.jpg')
    
    if (placeholderResponse) {
      return placeholderResponse
    }
    
    return new Response('', { status: 404 })
  }
}

// Handle static assets with cache-first strategy
async function handleStaticRequest(request) {
  // Skip Next.js hot reload and chunks to prevent ChunkLoadError
  if (request.url.includes('/_next/') && 
      (request.url.includes('webpack') || 
       request.url.includes('hot-update') ||
       request.url.includes('chunk'))) {
    return fetch(request)
  }
  
  try {
    const cache = await caches.open(STATIC_CACHE)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
    
  } catch (error) {
    console.log('Static asset not available offline:', request.url)
    return new Response('', { status: 404 })
  }
}

// Handle page requests with stale-while-revalidate
async function handlePageRequest(request) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE)
    const cachedResponse = await cache.match(request)
    
    // Return cached version immediately if available
    if (cachedResponse) {
      // Update cache in background
      fetch(request).then(response => {
        if (response.ok) {
          cache.put(request, response.clone())
        }
      }).catch(() => {
        // Network failed, cached version is still good
      })
      
      return cachedResponse
    }
    
    // No cache, try network
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
    
  } catch (error) {
    console.log('Page not available offline, showing fallback')
    
    // Return offline page
    const cache = await caches.open(STATIC_CACHE)
    return cache.match('/offline.html') || 
           new Response('<html><body><h1>Offline</h1><p>Please check your connection</p></body></html>', {
             headers: { 'Content-Type': 'text/html' }
           })
  }
}

// Background sync functions
async function syncPendingUploads() {
  console.log('🔄 Syncing pending uploads...')
  
  try {
    const db = await initializeOfflineDB()
    const transaction = db.transaction(['pendingUploads'], 'readwrite')
    const store = transaction.objectStore('pendingUploads')
    
    const uploads = await getAllFromStore(store)
    
    for (const upload of uploads) {
      try {
        // Attempt to upload
        const response = await fetch('/api/analyze-food', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${upload.token}`
          },
          body: JSON.stringify({
            imageDataUrl: upload.imageData,
            focusMode: upload.focusMode
          })
        })
        
        if (response.ok) {
          // Upload successful, remove from pending
          await deleteFromStore(store, upload.id)
          console.log('✅ Upload synced successfully:', upload.id)
          
          // Notify user if app is open
          notifyClients('uploadComplete', { uploadId: upload.id })
        }
        
      } catch (error) {
        console.error('Failed to sync upload:', upload.id, error)
      }
    }
    
  } catch (error) {
    console.error('Error syncing uploads:', error)
  }
}

async function syncPendingAnalyses() {
  console.log('🔄 Syncing pending analyses...')
  // Implementation for analysis sync would be similar
}

async function syncMealData() {
  console.log('🔄 Syncing meal data...')
  
  try {
    const token = await getStoredToken()
    if (!token) return
    
    const response = await fetch('/api/meals', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (response.ok) {
      const data = await response.json()
      const meals = data.meals || []
      
      // Update offline cache
      const db = await initializeOfflineDB()
      const transaction = db.transaction(['cachedMeals'], 'readwrite')
      const store = transaction.objectStore('cachedMeals')
      
      for (const meal of meals) {
        await putInStore(store, meal)
      }
      
      console.log('✅ Meal data synced successfully')
    }
    
  } catch (error) {
    console.error('Error syncing meal data:', error)
  }
}

// Utility functions
function isImageRequest(request) {
  return request.url.includes('/storage/') ||
         request.url.includes('image') ||
         request.url.includes('.jpg') ||
         request.url.includes('.jpeg') ||
         request.url.includes('.png') ||
         request.url.includes('.webp') ||
         request.headers.get('accept')?.includes('image')
}

function isStaticAsset(request) {
  const url = new URL(request.url)
  return url.pathname.startsWith('/_next/static/') ||
         url.pathname.startsWith('/icons/') ||
         url.pathname.startsWith('/images/') ||
         url.pathname.includes('.css') ||
         url.pathname.includes('.js') ||
         url.pathname.includes('.woff') ||
         url.pathname.includes('.ico') ||
         url.pathname.includes('.svg')
}

async function queueOfflineUpload(uploadData) {
  try {
    const db = await initializeOfflineDB()
    const transaction = db.transaction(['pendingUploads'], 'readwrite')
    const store = transaction.objectStore('pendingUploads')
    
    await putInStore(store, {
      ...uploadData,
      timestamp: Date.now()
    })
    
    // Request background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready
      await registration.sync.register(SYNC_TAGS.uploadMeal)
    }
  } catch (error) {
    console.error('Error queuing upload:', error)
  }
}

async function checkPendingSyncs() {
  try {
    const db = await initializeOfflineDB()
    const transaction = db.transaction(['pendingUploads'], 'readonly')
    const store = transaction.objectStore('pendingUploads')
    
    const uploads = await getAllFromStore(store)
    return uploads.length
  } catch (error) {
    console.error('Error checking pending syncs:', error)
    return 0
  }
}

async function getOfflineMeals() {
  try {
    const db = await initializeOfflineDB()
    const transaction = db.transaction(['cachedMeals'], 'readonly')
    const store = transaction.objectStore('cachedMeals')
    
    return await getAllFromStore(store)
  } catch (error) {
    console.error('Error getting offline meals:', error)
    return []
  }
}

// IndexedDB helper functions
function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

function putInStore(store, data) {
  return new Promise((resolve, reject) => {
    const request = store.put(data)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

function deleteFromStore(store, key) {
  return new Promise((resolve, reject) => {
    const request = store.delete(key)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

async function getStoredToken() {
  try {
    // Try to get token from various storage locations
    return localStorage.getItem('supabase.auth.token') || 
           sessionStorage.getItem('supabase.auth.token') || ''
  } catch {
    return ''
  }
}

function notifyClients(type, data) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type, data })
    })
  })
}

console.log('🚀 MealAppeal Service Worker v2 loaded') 