// PWA utilities for MealAppeal
// Handles service worker registration, offline detection, and push notifications

interface PWAInstallPrompt extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface NotificationPermissionState {
  permission: NotificationPermission
  canPrompt: boolean
  isSupported: boolean
}

interface OfflineUploadData {
  imageData: string
  focusMode: string
  token: string
  timestamp: number
}

// Service Worker Registration
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service Worker not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    })

    console.log('✅ Service Worker registered successfully:', registration.scope)

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        console.log('🔄 New Service Worker installing...')
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('✨ New Service Worker installed, showing update prompt')
            showUpdateAvailableNotification()
          }
        })
      }
    })

    // Listen for waiting service worker
    if (registration.waiting) {
      showUpdateAvailableNotification()
    }

    return registration
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error)
    return null
  }
}

// Update Service Worker
export function updateServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        window.location.reload()
      }
    })
  }
}

// Show update notification
function showUpdateAvailableNotification(): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification('MealAppeal Update Available', {
      body: 'A new version is available. Click to update.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      requireInteraction: true,
      // actions: [ // Not supported in all browsers
      //   {
      //     action: 'update',
      //     title: 'Update Now'
      //   },
      //   {
      //     action: 'dismiss',
      //     title: 'Later'
      //   }
      // ]
    })

    notification.onclick = () => {
      updateServiceWorker()
      notification.close()
    }
  } else {
    // Fallback to browser notification
    if (confirm('A new version of MealAppeal is available. Update now?')) {
      updateServiceWorker()
    }
  }
}

// PWA Installation
export class PWAInstaller {
  private deferredPrompt: PWAInstallPrompt | null = null
  private isInstalled = false

  constructor() {
    this.setupInstallPrompt()
    this.checkInstallationState()
  }

  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('📱 PWA install prompt available')
      e.preventDefault()
      this.deferredPrompt = e as PWAInstallPrompt
    })

    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA installed successfully')
      this.isInstalled = true
      this.deferredPrompt = null
    })
  }

  private checkInstallationState(): void {
    // Check if app is running in standalone mode
    this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                      (window.navigator as any).standalone === true
  }

  canInstall(): boolean {
    return this.deferredPrompt !== null && !this.isInstalled
  }

  isAppInstalled(): boolean {
    return this.isInstalled
  }

  async promptInstall(): Promise<{ outcome: string; platform: string } | null> {
    if (!this.deferredPrompt) {
      return null
    }

    try {
      await this.deferredPrompt.prompt()
      const result = await this.deferredPrompt.userChoice
      
      console.log('PWA install prompt result:', result)
      
      if (result.outcome === 'accepted') {
        this.deferredPrompt = null
      }
      
      return result
    } catch (error) {
      console.error('Error showing install prompt:', error)
      return null
    }
  }

  // Show install banner
  showInstallBanner(): HTMLElement | null {
    if (!this.canInstall()) return null

    const banner = document.createElement('div')
    banner.className = 'pwa-install-banner'
    banner.innerHTML = `
      <div style="
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: linear-gradient(135deg, #10b981, #ea580c);
        color: white;
        padding: 16px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        backdrop-filter: blur(8px);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <div>
          <div style="font-weight: 600; margin-bottom: 4px;">Install MealAppeal</div>
          <div style="font-size: 14px; opacity: 0.9;">Get the full app experience with offline access</div>
        </div>
        <div>
          <button id="pwa-install-btn" style="
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 8px;
            margin-right: 8px;
            cursor: pointer;
            font-weight: 500;
          ">Install</button>
          <button id="pwa-dismiss-btn" style="
            background: transparent;
            border: none;
            color: white;
            padding: 8px;
            cursor: pointer;
            opacity: 0.7;
          ">✕</button>
        </div>
      </div>
    `

    const installBtn = banner.querySelector('#pwa-install-btn')
    const dismissBtn = banner.querySelector('#pwa-dismiss-btn')

    installBtn?.addEventListener('click', async () => {
      const result = await this.promptInstall()
      if (result?.outcome === 'accepted') {
        banner.remove()
      }
    })

    dismissBtn?.addEventListener('click', () => {
      banner.remove()
      // Remember dismissal
      localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    })

    // Check if user previously dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) {
      return null // Don't show for 7 days after dismissal
    }

    return banner
  }
}

// Notification Permissions
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  const isSupported = 'Notification' in window
  
  if (!isSupported) {
    return {
      permission: 'denied',
      canPrompt: false,
      isSupported: false
    }
  }

  const currentPermission = Notification.permission
  let permission = currentPermission

  if (currentPermission === 'default') {
    try {
      permission = await Notification.requestPermission()
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      permission = 'denied'
    }
  }

  return {
    permission,
    canPrompt: permission === 'default',
    isSupported
  }
}

// Push Notification Subscription
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready
    
    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription()
    
    if (!subscription) {
      // Create new subscription
      const applicationServerKey = process.env['NEXT_PUBLIC_VAPID_PUBLIC_KEY']
      
      if (!applicationServerKey) {
        console.error('VAPID public key not configured')
        return null
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(applicationServerKey)
      })
    }

    console.log('✅ Push subscription active:', subscription.endpoint)
    return subscription
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error)
    return null
  }
}

// Convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Offline Detection
export class OfflineManager {
  private callbacks: Array<(isOnline: boolean) => void> = []
  private isOnline = navigator.onLine

  constructor() {
    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      console.log('🌐 Back online')
      this.isOnline = true
      this.notifyCallbacks(true)
    })

    window.addEventListener('offline', () => {
      console.log('📴 Gone offline')
      this.isOnline = false
      this.notifyCallbacks(false)
    })
  }

  private notifyCallbacks(isOnline: boolean): void {
    this.callbacks.forEach(callback => callback(isOnline))
  }

  onConnectionChange(callback: (isOnline: boolean) => void): () => void {
    this.callbacks.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback)
      if (index > -1) {
        this.callbacks.splice(index, 1)
      }
    }
  }

  getConnectionStatus(): boolean {
    return this.isOnline
  }

  // Queue upload for offline sync
  async queueOfflineUpload(data: OfflineUploadData): Promise<void> {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      if (registration.active) {
        registration.active.postMessage({
          type: 'QUEUE_UPLOAD',
          data
        })
      }
    }
  }

  // Check pending sync count
  async getPendingSyncCount(): Promise<number> {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      if (registration.active) {
        return new Promise((resolve) => {
          const messageChannel = new MessageChannel()
          messageChannel.port1.onmessage = (event) => {
            resolve(event.data.pendingCount || 0)
          }
          
          registration.active!.postMessage(
            { type: 'CHECK_SYNC' },
            [messageChannel.port2]
          )
        })
      }
    }
    return 0
  }
}

// Background Sync for Uploads
export async function registerBackgroundSync(tag: string): Promise<void> {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready
      await (registration as any).sync?.register(tag)
      console.log('✅ Background sync registered:', tag)
    } catch (error) {
      console.error('Failed to register background sync:', error)
    }
  }
}

// PWA Utilities Hook
export function usePWA() {
  const installer = new PWAInstaller()
  const offlineManager = new OfflineManager()

  return {
    // Installation
    canInstall: installer.canInstall(),
    isInstalled: installer.isAppInstalled(),
    promptInstall: () => installer.promptInstall(),
    showInstallBanner: () => installer.showInstallBanner(),

    // Offline
    isOnline: offlineManager.getConnectionStatus(),
    onConnectionChange: (callback: (isOnline: boolean) => void) => 
      offlineManager.onConnectionChange(callback),
    queueOfflineUpload: (data: OfflineUploadData) => 
      offlineManager.queueOfflineUpload(data),
    getPendingSyncCount: () => offlineManager.getPendingSyncCount(),

    // Notifications
    requestNotificationPermission,
    subscribeToPushNotifications,

    // Service Worker
    registerServiceWorker,
    updateServiceWorker,
    registerBackgroundSync
  }
}

// Meal Reminder Notifications
export class MealReminderManager {
  private reminders: Array<{ id: string; time: string; enabled: boolean }> = []

  constructor() {
    this.loadReminders()
  }

  private loadReminders(): void {
    try {
      const stored = localStorage.getItem('meal-reminders')
      if (stored) {
        this.reminders = JSON.parse(stored)
      } else {
        // Default reminders
        this.reminders = [
          { id: 'breakfast', time: '08:00', enabled: true },
          { id: 'lunch', time: '12:30', enabled: true },
          { id: 'dinner', time: '18:30', enabled: true }
        ]
        this.saveReminders()
      }
    } catch (error) {
      console.error('Error loading reminders:', error)
    }
  }

  private saveReminders(): void {
    try {
      localStorage.setItem('meal-reminders', JSON.stringify(this.reminders))
    } catch (error) {
      console.error('Error saving reminders:', error)
    }
  }

  getReminders(): Array<{ id: string; time: string; enabled: boolean }> {
    return [...this.reminders]
  }

  updateReminder(id: string, time: string, enabled: boolean): void {
    const index = this.reminders.findIndex(r => r.id === id)
    if (index >= 0) {
      this.reminders[index] = { id, time, enabled }
    } else {
      this.reminders.push({ id, time, enabled })
    }
    this.saveReminders()
    this.scheduleNotifications()
  }

  private scheduleNotifications(): void {
    // Clear existing timeouts
    // Note: In a real implementation, you'd want to use a more robust scheduling system
    
    this.reminders.forEach(reminder => {
      if (!reminder.enabled) return

      const [hours, minutes] = reminder.time.split(':').map(Number)
      const now = new Date()
      const scheduledTime = new Date()
      scheduledTime.setHours(hours || 0, minutes || 0, 0, 0)

      // If time has passed today, schedule for tomorrow
      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1)
      }

      const timeUntilNotification = scheduledTime.getTime() - now.getTime()

      setTimeout(() => {
        this.sendMealReminder(reminder.id)
      }, timeUntilNotification)
    })
  }

  private async sendMealReminder(mealType: string): Promise<void> {
    const permission = await requestNotificationPermission()
    
    if (permission.permission === 'granted') {
      const mealNames = {
        breakfast: 'breakfast',
        lunch: 'lunch', 
        dinner: 'dinner'
      }

      new Notification(`Time for ${mealNames[mealType as keyof typeof mealNames] || 'your meal'}! 🍽️`, {
        body: 'Don\'t forget to log your meal with MealAppeal\'s AI analysis.',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: `meal-reminder-${mealType}`,
        requireInteraction: false,
        // actions: [ // Not supported in all browsers
        //   {
        //     action: 'camera',
        //     title: 'Take Photo'
        //   },
        //   {
        //     action: 'dismiss',
        //     title: 'Later'
        //   }
        // ]
      })
    }
  }

  async initialize(): Promise<void> {
    const permission = await requestNotificationPermission()
    if (permission.permission === 'granted') {
      this.scheduleNotifications()
    }
  }
}

// Export default PWA manager
export const pwa = {
  installer: new PWAInstaller(),
  offlineManager: new OfflineManager(),
  reminderManager: new MealReminderManager()
}