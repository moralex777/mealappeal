export function registerServiceWorker() {
  if (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    process.env.NODE_ENV === 'production'
  ) {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('✅ Service Worker registered with scope:', registration.scope)
        
        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                console.log('🔄 New version available, refreshing...')
                window.location.reload()
              }
            })
          }
        })
      })
      .catch((err) => {
        console.error('❌ Service Worker registration failed:', err)
      })
  }
}

export function unregisterServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister()
        console.log('🗑️ Service Worker unregistered')
      })
      .catch((error) => {
        console.error('❌ Error unregistering service worker:', error)
      })
  }
} 