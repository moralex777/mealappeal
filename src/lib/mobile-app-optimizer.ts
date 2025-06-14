/**
 * Mobile App Optimizer
 * Native app-like experience optimization for iOS and Android PWA
 */

import { deviceDetection } from './device-detection'

export interface MobileOptimizationConfig {
  enableOfflineMode: boolean
  enablePushNotifications: boolean
  enableAppShortcuts: boolean
  enableFullscreenMode: boolean
  enableOrientationLock: boolean
  enableVibration: boolean
  enableWakeLock: boolean
  cacheStrategy: 'aggressive' | 'conservative' | 'smart'
}

export interface AppShortcut {
  name: string
  short_name?: string
  description: string
  url: string
  icons: Array<{
    src: string
    sizes: string
    type?: string
  }>
}

export interface PushNotificationConfig {
  title: string
  body: string
  icon: string
  badge?: string
  image?: string
  tag?: string
  data?: Record<string, any>
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

class MobileAppOptimizer {
  private isOptimized = false
  private config: MobileOptimizationConfig = {
    enableOfflineMode: true,
    enablePushNotifications: true,
    enableAppShortcuts: true,
    enableFullscreenMode: true,
    enableOrientationLock: false,
    enableVibration: true,
    enableWakeLock: false,
    cacheStrategy: 'smart'
  }

  /**
   * Initialize mobile app optimizations
   */
  async initialize(config?: Partial<MobileOptimizationConfig>): Promise<void> {
    if (this.isOptimized || typeof window === 'undefined') return

    this.config = { ...this.config, ...config }
    const deviceInfo = deviceDetection.getDeviceInfo()

    if (!deviceInfo.isMobile) return

    try {
      // Apply iOS-specific optimizations
      if (deviceInfo.platform === 'ios') {
        await this.applyIOSOptimizations()
      }

      // Apply Android-specific optimizations
      if (deviceInfo.platform === 'android') {
        await this.applyAndroidOptimizations()
      }

      // Apply universal mobile optimizations
      await this.applyUniversalOptimizations()

      this.isOptimized = true
      console.log('Mobile app optimizations applied successfully')
    } catch (error) {
      console.error('Failed to apply mobile optimizations:', error)
    }
  }

  /**
   * iOS-specific optimizations
   */
  private async applyIOSOptimizations(): Promise<void> {
    // Prevent bounce scrolling
    document.body.style.overscrollBehavior = 'none'
    
    // Hide Safari UI bars when scrolling
    this.hideIOSBars()

    // Optimize for iOS safe areas
    this.optimizeForSafeAreas()

    // Add iOS-specific meta tags if not present
    this.addIOSMetaTags()

    // Handle iOS-specific touch events
    this.optimizeIOSTouchEvents()
  }

  /**
   * Android-specific optimizations
   */
  private async applyAndroidOptimizations(): Promise<void> {
    // Set Android theme color
    const themeColorMeta = document.querySelector('meta[name="theme-color"]')
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', '#10b981')
    }

    // Add Android-specific shortcuts
    if (this.config.enableAppShortcuts) {
      await this.setupAppShortcuts()
    }

    // Optimize touch responsiveness
    this.optimizeAndroidTouch()
  }

  /**
   * Universal mobile optimizations
   */
  private async applyUniversalOptimizations(): Promise<void> {
    // Optimize viewport for mobile
    this.optimizeViewport()

    // Enable fullscreen mode if requested
    if (this.config.enableFullscreenMode) {
      this.enableFullscreenMode()
    }

    // Setup orientation handling
    this.setupOrientationHandling()

    // Optimize touch interactions
    this.optimizeTouchInteractions()

    // Setup vibration feedback
    if (this.config.enableVibration) {
      this.setupVibrationFeedback()
    }

    // Setup wake lock if supported
    if (this.config.enableWakeLock) {
      this.setupWakeLock()
    }

    // Optimize performance
    this.optimizePerformance()

    // Setup offline capabilities
    if (this.config.enableOfflineMode) {
      this.setupOfflineMode()
    }

    // Setup push notifications
    if (this.config.enablePushNotifications) {
      await this.setupPushNotifications()
    }
  }

  /**
   * Hide iOS Safari UI bars
   */
  private hideIOSBars(): void {
    const hideOnScroll = () => {
      window.scrollTo(0, 1)
    }

    window.addEventListener('load', hideOnScroll)
    window.addEventListener('orientationchange', () => {
      setTimeout(hideOnScroll, 600)
    })
  }

  /**
   * Optimize for iOS safe areas
   */
  private optimizeForSafeAreas(): void {
    // Add CSS custom properties for safe areas
    const style = document.createElement('style')
    style.textContent = `
      :root {
        --safe-area-top: env(safe-area-inset-top);
        --safe-area-right: env(safe-area-inset-right);
        --safe-area-bottom: env(safe-area-inset-bottom);
        --safe-area-left: env(safe-area-inset-left);
      }
      
      .safe-area-padding {
        padding-top: max(20px, var(--safe-area-top));
        padding-right: max(20px, var(--safe-area-right));
        padding-bottom: max(20px, var(--safe-area-bottom));
        padding-left: max(20px, var(--safe-area-left));
      }
    `
    document.head.appendChild(style)
  }

  /**
   * Add iOS-specific meta tags
   */
  private addIOSMetaTags(): void {
    const metaTags = [
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      { name: 'apple-mobile-web-app-title', content: 'MealAppeal' },
      { name: 'apple-touch-fullscreen', content: 'yes' },
      { name: 'mobile-web-app-capable', content: 'yes' }
    ]

    metaTags.forEach(({ name, content }) => {
      if (!document.querySelector(`meta[name="${name}"]`)) {
        const meta = document.createElement('meta')
        meta.name = name
        meta.content = content
        document.head.appendChild(meta)
      }
    })
  }

  /**
   * Optimize iOS touch events
   */
  private optimizeIOSTouchEvents(): void {
    // Prevent zoom on double tap
    let lastTouchEnd = 0
    document.addEventListener('touchend', (event) => {
      const now = new Date().getTime()
      if (now - lastTouchEnd <= 300) {
        event.preventDefault()
      }
      lastTouchEnd = now
    }, false)

    // Improve scrolling performance
    document.addEventListener('touchstart', () => {}, { passive: true })
    document.addEventListener('touchmove', () => {}, { passive: true })
  }

  /**
   * Setup app shortcuts for Android
   */
  private async setupAppShortcuts(): Promise<void> {
    const shortcuts: AppShortcut[] = [
      {
        name: 'Capture Food',
        short_name: 'Camera',
        description: 'Take a photo of your meal',
        url: '/camera?source=shortcut',
        icons: [
          {
            src: '/icons/camera-192.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      },
      {
        name: 'View Meals',
        short_name: 'Meals',
        description: 'Browse your meal history',
        url: '/meals?source=shortcut',
        icons: [
          {
            src: '/icons/meals-192.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      },
      {
        name: 'AI Analysis',
        short_name: 'Analysis',
        description: 'Get detailed nutrition insights',
        url: '/analysis?source=shortcut',
        icons: [
          {
            src: '/icons/analysis-192.png',
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    ]

    // Update manifest with shortcuts
    try {
      const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement
      if (manifestLink) {
        const response = await fetch(manifestLink.href)
        const manifest = await response.json()
        manifest.shortcuts = shortcuts
        
        // Create updated manifest blob
        const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' })
        const manifestUrl = URL.createObjectURL(manifestBlob)
        
        // Update manifest link
        manifestLink.href = manifestUrl
      }
    } catch (error) {
      console.error('Failed to setup app shortcuts:', error)
    }
  }

  /**
   * Optimize Android touch responsiveness
   */
  private optimizeAndroidTouch(): void {
    // Reduce touch delay
    const style = document.createElement('style')
    style.textContent = `
      * {
        touch-action: manipulation;
      }
      
      button, [role="button"], input[type="submit"] {
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
    `
    document.head.appendChild(style)
  }

  /**
   * Optimize viewport for mobile
   */
  private optimizeViewport(): void {
    const viewport = document.querySelector('meta[name="viewport"]')
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
      )
    }
  }

  /**
   * Enable fullscreen mode
   */
  private enableFullscreenMode(): void {
    // Add fullscreen CSS
    const style = document.createElement('style')
    style.textContent = `
      @media (display-mode: fullscreen) {
        body {
          padding-top: var(--safe-area-top, 0);
        }
      }
    `
    document.head.appendChild(style)

    // Handle fullscreen events
    document.addEventListener('fullscreenchange', () => {
      if (document.fullscreenElement) {
        document.body.classList.add('fullscreen-mode')
      } else {
        document.body.classList.remove('fullscreen-mode')
      }
    })
  }

  /**
   * Setup orientation handling
   */
  private setupOrientationHandling(): void {
    const handleOrientationChange = () => {
      // Update CSS custom properties
      document.documentElement.style.setProperty(
        '--vh', 
        `${window.innerHeight * 0.01}px`
      )

      // Trigger resize event after orientation change
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'))
      }, 100)
    }

    window.addEventListener('orientationchange', handleOrientationChange)
    window.addEventListener('resize', handleOrientationChange)
    
    // Initial setup
    handleOrientationChange()

    // Lock orientation if requested
    if (this.config.enableOrientationLock && 'screen' in window && 'orientation' in screen) {
      try {
        (screen.orientation as any).lock('portrait-primary')
      } catch (error) {
        console.warn('Orientation lock not supported:', error)
      }
    }
  }

  /**
   * Optimize touch interactions
   */
  private optimizeTouchInteractions(): void {
    // Add touch feedback styles
    const style = document.createElement('style')
    style.textContent = `
      .touch-feedback {
        transition: transform 0.1s ease, background-color 0.1s ease;
      }
      
      .touch-feedback:active {
        transform: scale(0.95);
        background-color: rgba(0, 0, 0, 0.05);
      }
      
      .touch-target {
        min-height: 44px;
        min-width: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `
    document.head.appendChild(style)

    // Auto-apply touch feedback to interactive elements
    const interactiveSelectors = 'button, [role="button"], .clickable, .touch-feedback'
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll(interactiveSelectors).forEach(element => {
        element.classList.add('touch-feedback')
      })
    })
  }

  /**
   * Setup vibration feedback
   */
  private setupVibrationFeedback(): void {
    if (!('vibrate' in navigator)) return

    // Add vibration to touch events
    const addVibrationFeedback = (element: Element, pattern: number | number[]) => {
      element.addEventListener('touchstart', () => {
        navigator.vibrate(pattern)
      }, { passive: true })
    }

    // Different vibration patterns for different interactions
    document.addEventListener('DOMContentLoaded', () => {
      // Button clicks - short vibration
      document.querySelectorAll('button, [role="button"]').forEach(button => {
        addVibrationFeedback(button, 10)
      })

      // Important actions - double vibration
      document.querySelectorAll('.vibrate-strong').forEach(element => {
        addVibrationFeedback(element, [50, 50, 50])
      })

      // Success actions - pattern vibration
      document.querySelectorAll('.vibrate-success').forEach(element => {
        addVibrationFeedback(element, [100, 50, 100])
      })
    })
  }

  /**
   * Setup wake lock to prevent screen from sleeping
   */
  private async setupWakeLock(): Promise<void> {
    if (!('wakeLock' in navigator)) return

    try {
      let wakeLock: any = null

      const requestWakeLock = async () => {
        try {
          wakeLock = await (navigator as any).wakeLock.request('screen')
          wakeLock.addEventListener('release', () => {
            console.log('Wake lock released')
          })
        } catch (error) {
          console.error('Wake lock request failed:', error)
        }
      }

      // Request wake lock when app becomes visible
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          requestWakeLock()
        }
      })

      // Initial wake lock request
      await requestWakeLock()
    } catch (error) {
      console.warn('Wake lock not supported:', error)
    }
  }

  /**
   * Optimize performance for mobile
   */
  private optimizePerformance(): void {
    // Enable hardware acceleration
    const style = document.createElement('style')
    style.textContent = `
      .hw-accelerated {
        transform: translateZ(0);
        will-change: transform;
      }
      
      .smooth-scroll {
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
      }
      
      img, video {
        image-rendering: -webkit-optimize-contrast;
      }
    `
    document.head.appendChild(style)

    // Optimize scrolling
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('.scroll-container').forEach(container => {
        container.classList.add('smooth-scroll')
      })
    })

    // Preload critical resources
    this.preloadCriticalResources()
  }

  /**
   * Setup offline mode capabilities
   */
  private setupOfflineMode(): void {
    // Register service worker if not already registered
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(error => {
        console.error('Service worker registration failed:', error)
      })
    }

    // Add offline indicator
    this.setupOfflineIndicator()

    // Setup background sync
    this.setupBackgroundSync()
  }

  /**
   * Setup push notifications
   */
  private async setupPushNotifications(): Promise<void> {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return
    }

    // Request notification permission
    if (Notification.permission === 'default') {
      await Notification.requestPermission()
    }

    if (Notification.permission === 'granted') {
      // Setup push notification subscription
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env['NEXT_PUBLIC_VAPID_PUBLIC_KEY']
        })

        // Send subscription to server
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(subscription)
        })
      } catch (error) {
        console.error('Push notification setup failed:', error)
      }
    }
  }

  /**
   * Preload critical resources
   */
  private preloadCriticalResources(): void {
    const criticalResources = [
      '/icons/icon-192.png',
      '/icons/icon-512.png',
      '/api/analyze-food', // Preconnect to API
    ]

    criticalResources.forEach(resource => {
      if (resource.startsWith('/api/')) {
        // Preconnect to API endpoints
        const link = document.createElement('link')
        link.rel = 'preconnect'
        link.href = resource
        document.head.appendChild(link)
      } else {
        // Preload assets
        const link = document.createElement('link')
        link.rel = 'preload'
        link.href = resource
        link.as = resource.endsWith('.png') ? 'image' : 'fetch'
        document.head.appendChild(link)
      }
    })
  }

  /**
   * Setup offline indicator
   */
  private setupOfflineIndicator(): void {
    const showOfflineIndicator = () => {
      const indicator = document.createElement('div')
      indicator.id = 'offline-indicator'
      indicator.innerHTML = '📡 You\'re offline. Changes will sync when connected.'
      indicator.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #f59e0b;
        color: white;
        text-align: center;
        padding: 8px;
        font-size: 14px;
        z-index: 10000;
      `
      document.body.appendChild(indicator)
    }

    const hideOfflineIndicator = () => {
      const indicator = document.getElementById('offline-indicator')
      if (indicator) {
        indicator.remove()
      }
    }

    window.addEventListener('online', hideOfflineIndicator)
    window.addEventListener('offline', showOfflineIndicator)

    // Initial check
    if (!navigator.onLine) {
      showOfflineIndicator()
    }
  }

  /**
   * Setup background sync
   */
  private setupBackgroundSync(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        if ('sync' in registration) {
          // Register sync events
          return (registration as any).sync.register('background-sync')
        }
      }).catch(error => {
        console.error('Background sync setup failed:', error)
      })
    }
  }

  /**
   * Send push notification
   */
  async sendPushNotification(config: PushNotificationConfig): Promise<void> {
    if (Notification.permission !== 'granted') return

    try {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification(config.title, {
        body: config.body,
        icon: config.icon,
        badge: config.badge,
        // image: config.image, // Not supported in all browsers
        tag: config.tag,
        data: config.data,
        // actions: config.actions, // Not supported in all browsers
        requireInteraction: false,
        silent: false
      })
    } catch (error) {
      console.error('Push notification failed:', error)
    }
  }

  /**
   * Get optimization status
   */
  getOptimizationStatus() {
    const deviceInfo = deviceDetection.getDeviceInfo()
    
    return {
      isOptimized: this.isOptimized,
      deviceInfo,
      config: this.config,
      features: {
        offlineSupported: 'serviceWorker' in navigator,
        pushSupported: 'Notification' in window && 'serviceWorker' in navigator,
        vibrationSupported: 'vibrate' in navigator,
        wakeLockSupported: 'wakeLock' in navigator,
        orientationLockSupported: 'screen' in window && 'orientation' in screen,
        fullscreenSupported: 'requestFullscreen' in document.documentElement
      }
    }
  }
}

// Export singleton instance
export const mobileAppOptimizer = new MobileAppOptimizer()

// Utility functions
export const initializeMobileOptimizations = (config?: Partial<MobileOptimizationConfig>) =>
  mobileAppOptimizer.initialize(config)

export const sendPushNotification = (config: PushNotificationConfig) =>
  mobileAppOptimizer.sendPushNotification(config)

export const getOptimizationStatus = () =>
  mobileAppOptimizer.getOptimizationStatus()