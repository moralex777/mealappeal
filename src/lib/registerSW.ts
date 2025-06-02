declare global {
  interface Window {
    workbox: any
  }
}

export function registerServiceWorker() {
  if (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    window.workbox !== undefined
  ) {
    const wb = window.workbox
    
    // Add offline fallback
    const navigationPreload = wb.navigationPreload
    navigationPreload.enable()

    // Runtime caching
    wb.routing.registerRoute(
      new RegExp('/*'),
      new wb.strategies.StaleWhileRevalidate({
        cacheName: 'all-cache',
        plugins: [
          new wb.expiration.ExpirationPlugin({
            maxEntries: 200,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          }),
        ],
      })
    )

    // Offline Google Analytics
    wb.googleAnalytics.initialize()

    // Clean up old caches
    wb.core.clientsClaim()
    wb.core.skipWaiting()

    // Reload page when new version is available
    wb.addEventListener('waiting', () => {
      wb.messageSkipWaiting()
      window.location.reload()
    })

    // Register service worker
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope)
      })
      .catch((err) => {
        console.error('Service Worker registration failed:', err)
      })
  }
} 