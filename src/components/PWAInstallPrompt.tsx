'use client'

import { 
  Download, 
  Smartphone, 
  Home, 
  Share, 
  Plus, 
  X, 
  Star,
  Zap,
  Camera,
  Bell,
  Wifi,
  CheckCircle
} from 'lucide-react'
import React, { useState, useEffect } from 'react'

import { useDeviceDetection } from '@/lib/device-detection'

interface PWAInstallPromptProps {
  variant?: 'banner' | 'modal' | 'inline' | 'floating'
  trigger?: 'immediate' | 'delayed' | 'engagement' | 'manual'
  delay?: number
  showOnce?: boolean
  customTrigger?: () => boolean
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallPrompt({
  variant = 'banner',
  trigger = 'engagement',
  delay = 3000,
  showOnce = true,
  customTrigger
}: PWAInstallPromptProps) {
  const { deviceInfo, features } = useDeviceDetection()
  
  const [isVisible, setIsVisible] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalling, setIsInstalling] = useState(false)
  const [installationState, setInstallationState] = useState<'available' | 'installing' | 'installed' | 'unavailable'>('unavailable')
  const [userInteractions, setUserInteractions] = useState(0)

  // Check if PWA is already installed
  useEffect(() => {
    const isInPWA = window.matchMedia('(display-mode: standalone)').matches ||
                    (window.navigator as any).standalone === true ||
                    document.referrer.includes('android-app://')

    if (isInPWA) {
      setInstallationState('installed')
      return
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setInstallationState('available')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  // Handle trigger logic
  useEffect(() => {
    if (installationState !== 'available' || !deviceInfo.isMobile) {
      return
    }

    // Check if already dismissed
    if (showOnce) {
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      if (dismissed) {
        const dismissTime = parseInt(dismissed)
        const hoursSinceDismiss = (Date.now() - dismissTime) / (1000 * 60 * 60)
        if (hoursSinceDismiss < 168) { // 7 days
          return
        }
      }
    }

    switch (trigger) {
      case 'immediate':
        setIsVisible(true)
        break
      
      case 'delayed':
        setTimeout(() => setIsVisible(true), delay)
        break
      
      case 'engagement':
        // Show after user interactions
        const handleInteraction = () => {
          setUserInteractions(prev => {
            const newCount = prev + 1
            if (newCount >= 3) { // After 3 interactions
              setTimeout(() => setIsVisible(true), 1000)
            }
            return newCount
          })
        }
        
        document.addEventListener('click', handleInteraction)
        document.addEventListener('scroll', handleInteraction)
        
        return () => {
          document.removeEventListener('click', handleInteraction)
          document.removeEventListener('scroll', handleInteraction)
        }
      
      case 'manual':
        if (customTrigger && customTrigger()) {
          setIsVisible(true)
        }
        break
    }
    return undefined
  }, [installationState, deviceInfo.isMobile, trigger, delay, userInteractions])

  const handleInstall = async () => {
    if (!deferredPrompt) {return}

    setIsInstalling(true)
    setInstallationState('installing')

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        setInstallationState('installed')
        setIsVisible(false)
        
        // Track successful installation
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', 'pwa_install_success', {
            platform: deviceInfo.platform,
            device_type: deviceInfo.isMobile ? 'mobile' : 'desktop',
            trigger_type: trigger
          })
        }
      } else {
        setInstallationState('available')
        handleDismiss()
      }
    } catch (error) {
      console.error('PWA installation failed:', error)
      setInstallationState('available')
    } finally {
      setIsInstalling(false)
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    
    if (showOnce) {
      localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    }

    // Track dismissal
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'pwa_install_dismissed', {
        platform: deviceInfo.platform,
        device_type: deviceInfo.isMobile ? 'mobile' : 'desktop',
        variant
      })
    }
  }

  const getInstallInstructions = () => {
    if (deviceInfo.platform === 'ios') {
      return {
        title: '📱 Add to Home Screen',
        steps: [
          { icon: Share, text: 'Tap the Share button in Safari' },
          { icon: Plus, text: 'Select "Add to Home Screen"' },
          { icon: Home, text: 'Tap "Add" to install' }
        ],
        note: 'Get instant access with a home screen icon'
      }
    } else if (deviceInfo.platform === 'android') {
      return {
        title: '📱 Install App',
        steps: [
          { icon: Download, text: 'Tap "Install" when prompted' },
          { icon: Home, text: 'Find MealAppeal on your home screen' },
          { icon: Zap, text: 'Enjoy the full app experience' }
        ],
        note: 'Works offline and loads instantly'
      }
    } else {
      return {
        title: '💻 Install App',
        steps: [
          { icon: Download, text: 'Click "Install" in the address bar' },
          { icon: Home, text: 'Access from your desktop' },
          { icon: Zap, text: 'Enjoy native app performance' }
        ],
        note: 'Fast, reliable, and works offline'
      }
    }
  }

  const getPWABenefits = () => [
    {
      icon: Camera,
      title: 'Instant Camera Access',
      description: 'Quick photo capture and analysis'
    },
    {
      icon: Wifi,
      title: 'Offline Mode',
      description: 'Save photos and sync when connected'
    },
    {
      icon: Bell,
      title: 'Smart Notifications',
      description: 'Meal reminders and nutrition tips'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Loads instantly like a native app'
    }
  ]

  if (!isVisible || installationState === 'installed') {
    return null
  }

  const instructions = getInstallInstructions()
  const benefits = getPWABenefits()

  // Render based on variant
  if (variant === 'banner') {
    return (
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        padding: '16px',
        zIndex: 1000,
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.1)'
      }}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div style={{
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              padding: '8px'
            }}>
              <Download className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-sm">
                📱 Install MealAppeal
              </p>
              <p className="text-white/90 text-xs">
                Get instant access and offline features
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              style={{
                background: 'rgba(255, 255, 255, 0.9)',
                color: '#059669',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {isInstalling ? 'Installing...' : 'Install'}
            </button>
            
            <button
              onClick={handleDismiss}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'modal') {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '400px',
          width: '100%',
          textAlign: 'center',
          position: 'relative'
        }}>
          <button
            onClick={handleDismiss}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            <X className="w-6 h-6" />
          </button>

          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '50%',
            width: '64px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <Smartphone className="w-8 h-8 text-white" />
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {instructions.title}
          </h3>
          
          <p className="text-gray-600 mb-6">
            {instructions.note}
          </p>

          {/* Benefits */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="text-center">
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '8px',
                  padding: '8px',
                  display: 'inline-flex',
                  marginBottom: '8px'
                }}>
                  <benefit.icon className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-900">{benefit.title}</p>
                <p className="text-xs text-gray-600">{benefit.description}</p>
              </div>
            ))}
          </div>

          {/* Install Steps */}
          {deviceInfo.platform === 'ios' ? (
            <div className="space-y-3 mb-6">
              {instructions.steps.map((step, index) => (
                <div key={index} className="flex items-center gap-3 text-left">
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.1)',
                    borderRadius: '50%',
                    padding: '8px',
                    minWidth: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <step.icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-700">{step.text}</span>
                </div>
              ))}
            </div>
          ) : (
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                borderRadius: '12px',
                padding: '16px 32px',
                fontSize: '16px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '16px'
              }}
            >
              {isInstalling ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Installing...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Install MealAppeal
                </>
              )}
            </button>
          )}

          <p className="text-xs text-gray-500">
            Free to install • No app store required
          </p>
        </div>
      </div>
    )
  }

  if (variant === 'floating') {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'white',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        maxWidth: '300px',
        zIndex: 1000
      }}>
        <button
          onClick={handleDismiss}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#9ca3af'
          }}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '8px',
            padding: '8px'
          }}>
            <Smartphone className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900">
              Install MealAppeal
            </p>
            <p className="text-xs text-gray-600">
              Native app experience
            </p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          {benefits.slice(0, 2).map((benefit, index) => (
            <div key={index} className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-700">{benefit.title}</span>
            </div>
          ))}
        </div>

        <button
          onClick={deviceInfo.platform === 'ios' ? handleDismiss : handleInstall}
          disabled={isInstalling}
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            borderRadius: '8px',
            padding: '10px 16px',
            fontSize: '14px',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer',
            width: '100%'
          }}
        >
          {deviceInfo.platform === 'ios' 
            ? 'Show Instructions' 
            : isInstalling ? 'Installing...' : 'Install Now'
          }
        </button>
      </div>
    )
  }

  // Inline variant
  return (
    <div style={{
      background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
      border: '1px solid #10b981',
      borderRadius: '12px',
      padding: '20px',
      margin: '16px 0'
    }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <Download className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">
                Install MealAppeal App
              </h3>
              <p className="text-sm text-green-800">
                Get the full native app experience
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2">
                <benefit.icon className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">{benefit.title}</span>
              </div>
            ))}
          </div>

          <button
            onClick={deviceInfo.platform === 'ios' ? handleDismiss : handleInstall}
            disabled={isInstalling}
            style={{
              background: '#10b981',
              color: 'white',
              borderRadius: '8px',
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            {deviceInfo.platform === 'ios' 
              ? 'Show Install Guide' 
              : isInstalling ? 'Installing...' : 'Install App'
            }
          </button>
        </div>

        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#6b7280'
          }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

// Hook for programmatic PWA installation
export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if PWA is already installed
    const isInPWA = window.matchMedia('(display-mode: standalone)').matches ||
                    (window.navigator as any).standalone === true
    setIsInstalled(isInPWA)

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const install = async () => {
    if (!installPrompt) {return false}

    try {
      await installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      
      if (outcome === 'accepted') {
        setIsInstalled(true)
        setIsInstallable(false)
        setInstallPrompt(null)
        return true
      }
      return false
    } catch (error) {
      console.error('PWA installation failed:', error)
      return false
    }
  }

  return {
    isInstallable,
    isInstalled,
    install
  }
}