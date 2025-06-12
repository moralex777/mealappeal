'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { MobileRecommendationBanner } from './MobileRecommendationBanner'
import { PWAInstallPrompt } from './PWAInstallPrompt'
import { useDeviceDetection } from '@/lib/device-detection'
import { initializeMobileOptimizations } from '@/lib/mobile-app-optimizer'
import { initializeAnalytics, trackPageView } from '@/lib/device-analytics'
import { useHandoffRedirect } from '@/hooks/useHandoffRedirect'

interface MobileFirstUXConfig {
  // Banner configuration
  showMobileBanner: boolean
  bannerVariant: 'minimal' | 'standard' | 'compelling' | 'urgent'
  bannerPosition: 'top' | 'bottom' | 'floating'
  
  // PWA configuration
  enablePWAPrompts: boolean
  pwaPromptTrigger: 'immediate' | 'delayed' | 'engagement' | 'manual'
  pwaPromptVariant: 'banner' | 'modal' | 'inline' | 'floating'
  
  // Analytics configuration
  enableAnalytics: boolean
  trackDeviceJourneys: boolean
  trackConversions: boolean
  
  // Mobile optimization configuration
  enableMobileOptimizations: boolean
  optimizationLevel: 'basic' | 'enhanced' | 'aggressive'
  
  // QR code configuration
  autoGenerateQRCodes: boolean
  qrCodeStyle: 'default' | 'branded' | 'minimal'
  
  // Handoff configuration
  enableHandoffRedirect: boolean
  showHandoffToasts: boolean
}

interface MobileFirstUXContextType {
  config: MobileFirstUXConfig
  updateConfig: (updates: Partial<MobileFirstUXConfig>) => void
  deviceInfo: any
  features: any
  isHandoffActive: boolean
  handoffState: any
}

const defaultConfig: MobileFirstUXConfig = {
  showMobileBanner: true,
  bannerVariant: 'compelling',
  bannerPosition: 'top',
  enablePWAPrompts: true,
  pwaPromptTrigger: 'engagement',
  pwaPromptVariant: 'floating',
  enableAnalytics: true,
  trackDeviceJourneys: true,
  trackConversions: true,
  enableMobileOptimizations: true,
  optimizationLevel: 'enhanced',
  autoGenerateQRCodes: true,
  qrCodeStyle: 'branded',
  enableHandoffRedirect: true,
  showHandoffToasts: true
}

const MobileFirstUXContext = createContext<MobileFirstUXContextType | null>(null)

interface MobileFirstUXProviderProps {
  children: React.ReactNode
  config?: Partial<MobileFirstUXConfig>
  pageSpecificConfig?: Record<string, Partial<MobileFirstUXConfig>>
}

export function MobileFirstUXProvider({
  children,
  config: initialConfig = {},
  pageSpecificConfig = {}
}: MobileFirstUXProviderProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { deviceInfo, features } = useDeviceDetection()
  const handoffState = useHandoffRedirect()

  const [config, setConfig] = useState<MobileFirstUXConfig>(() => {
    // Merge default config with initial config and page-specific config
    const pageConfig = pageSpecificConfig[pathname] || {}
    return {
      ...defaultConfig,
      ...initialConfig,
      ...pageConfig
    }
  })

  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize all services
  useEffect(() => {
    if (isInitialized) return

    const initialize = async () => {
      try {
        // Initialize analytics if enabled
        if (config.enableAnalytics) {
          initializeAnalytics()
        }

        // Initialize mobile optimizations if enabled and on mobile
        if (config.enableMobileOptimizations && deviceInfo.isMobile) {
          const optimizationConfig = {
            enableOfflineMode: true,
            enablePushNotifications: config.optimizationLevel !== 'basic',
            enableAppShortcuts: config.optimizationLevel === 'aggressive',
            enableFullscreenMode: config.optimizationLevel !== 'basic',
            enableOrientationLock: false,
            enableVibration: config.optimizationLevel !== 'basic',
            enableWakeLock: config.optimizationLevel === 'aggressive',
            cacheStrategy: config.optimizationLevel === 'basic' ? 'conservative' as const : 'smart' as const
          }
          
          await initializeMobileOptimizations(optimizationConfig)
        }

        setIsInitialized(true)
      } catch (error) {
        console.error('Failed to initialize Mobile-First UX:', error)
      }
    }

    initialize()
  }, [config, deviceInfo.isMobile, isInitialized])

  // Track page views
  useEffect(() => {
    if (config.enableAnalytics && isInitialized) {
      trackPageView(pathname)
    }
  }, [pathname, config.enableAnalytics, isInitialized])

  // Update config when page changes
  useEffect(() => {
    const pageConfig = pageSpecificConfig[pathname] || {}
    setConfig(prevConfig => ({
      ...prevConfig,
      ...pageConfig
    }))
  }, [pathname, pageSpecificConfig])

  const updateConfig = (updates: Partial<MobileFirstUXConfig>) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      ...updates
    }))
  }

  const contextValue: MobileFirstUXContextType = {
    config,
    updateConfig,
    deviceInfo,
    features,
    isHandoffActive: !!searchParams.get('handoff'),
    handoffState
  }

  return (
    <MobileFirstUXContext.Provider value={contextValue}>
      {/* Handoff Success Toast */}
      {config.showHandoffToasts && handoffState.isComplete && handoffState.message && (
        <HandoffSuccessToast
          message={handoffState.message}
          autoLogin={handoffState.autoLogin}
          onDismiss={() => {}}
        />
      )}

      {/* Mobile Recommendation Banner */}
      {config.showMobileBanner && features.showMobileBanner && (
        <MobileRecommendationBanner
          variant={config.bannerVariant}
          position={config.bannerPosition}
          showOnce={true}
          trackingContext={{
            page: pathname,
            timestamp: Date.now()
          }}
        />
      )}

      {/* PWA Installation Prompt */}
      {config.enablePWAPrompts && deviceInfo.isMobile && (
        <PWAInstallPrompt
          variant={config.pwaPromptVariant}
          trigger={config.pwaPromptTrigger}
          showOnce={true}
        />
      )}

      {/* App Content */}
      {children}

      {/* Mobile Optimizations Styles */}
      {config.enableMobileOptimizations && (
        <MobileOptimizationStyles level={config.optimizationLevel} />
      )}
    </MobileFirstUXContext.Provider>
  )
}

// Handoff Success Toast Component
function HandoffSuccessToast({
  message,
  autoLogin,
  onDismiss
}: {
  message: string
  autoLogin: boolean
  onDismiss: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      borderRadius: '12px',
      padding: '16px 20px',
      boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
      zIndex: 10000,
      maxWidth: '400px',
      animation: 'slideInRight 0.3s ease-out'
    }}>
      <div className="flex items-start gap-3">
        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          ✓
        </div>
        <div>
          <p className="font-medium mb-1">
            {autoLogin ? '🎉 Welcome back!' : '📱 Mobile handoff successful!'}
          </p>
          <p className="text-white/90 text-sm">{message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-white/80 hover:text-white text-lg leading-none ml-2"
        >
          ×
        </button>
      </div>
    </div>
  )
}

// Mobile Optimization Styles Component
function MobileOptimizationStyles({ level }: { level: 'basic' | 'enhanced' | 'aggressive' }) {
  const styles = `
    /* Mobile-First UX Optimizations */
    @media (max-width: 768px) {
      /* Touch targets */
      button, [role="button"], input, select, textarea {
        min-height: 44px;
        min-width: 44px;
      }
      
      /* Remove tap highlights */
      * {
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }
      
      /* Smooth scrolling */
      html {
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
      }
      
      /* Prevent zoom on input focus */
      input, select, textarea {
        font-size: 16px;
      }
      
      ${level !== 'basic' ? `
        /* Enhanced optimizations */
        body {
          overscroll-behavior: none;
        }
        
        /* Hardware acceleration for smooth animations */
        .animate {
          transform: translateZ(0);
          will-change: transform;
        }
        
        /* Optimize font rendering */
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      ` : ''}
      
      ${level === 'aggressive' ? `
        /* Aggressive optimizations */
        * {
          /* Reduce repaints */
          backface-visibility: hidden;
          perspective: 1000px;
        }
        
        /* Preload critical resources */
        img {
          loading: lazy;
          decoding: async;
        }
        
        /* Optimize list rendering */
        .virtual-list {
          contain: layout style paint;
        }
      ` : ''}
    }
    
    /* PWA optimizations */
    @media (display-mode: standalone) {
      body {
        padding-top: env(safe-area-inset-top);
        padding-bottom: env(safe-area-inset-bottom);
      }
      
      .safe-area-padding {
        padding-left: env(safe-area-inset-left);
        padding-right: env(safe-area-inset-right);
      }
    }
    
    /* Handoff animations */
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes fadeInUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    @keyframes expandDown {
      from {
        max-height: 0;
        opacity: 0;
      }
      to {
        max-height: 500px;
        opacity: 1;
      }
    }
  `

  return <style dangerouslySetInnerHTML={{ __html: styles }} />
}

// Hook to use Mobile-First UX context
export function useMobileFirstUX() {
  const context = useContext(MobileFirstUXContext)
  if (!context) {
    throw new Error('useMobileFirstUX must be used within a MobileFirstUXProvider')
  }
  return context
}

// Utility hooks for specific features
export function useMobileBannerConfig() {
  const { config, updateConfig } = useMobileFirstUX()
  
  return {
    isEnabled: config.showMobileBanner,
    variant: config.bannerVariant,
    position: config.bannerPosition,
    enable: () => updateConfig({ showMobileBanner: true }),
    disable: () => updateConfig({ showMobileBanner: false }),
    setVariant: (variant: MobileFirstUXConfig['bannerVariant']) => 
      updateConfig({ bannerVariant: variant }),
    setPosition: (position: MobileFirstUXConfig['bannerPosition']) => 
      updateConfig({ bannerPosition: position })
  }
}

export function usePWAConfig() {
  const { config, updateConfig } = useMobileFirstUX()
  
  return {
    isEnabled: config.enablePWAPrompts,
    variant: config.pwaPromptVariant,
    trigger: config.pwaPromptTrigger,
    enable: () => updateConfig({ enablePWAPrompts: true }),
    disable: () => updateConfig({ enablePWAPrompts: false }),
    setVariant: (variant: MobileFirstUXConfig['pwaPromptVariant']) => 
      updateConfig({ pwaPromptVariant: variant }),
    setTrigger: (trigger: MobileFirstUXConfig['pwaPromptTrigger']) => 
      updateConfig({ pwaPromptTrigger: trigger })
  }
}

export function useHandoffConfig() {
  const { config, updateConfig, isHandoffActive, handoffState } = useMobileFirstUX()
  
  return {
    isEnabled: config.enableHandoffRedirect,
    showToasts: config.showHandoffToasts,
    isActive: isHandoffActive,
    state: handoffState,
    enable: () => updateConfig({ enableHandoffRedirect: true }),
    disable: () => updateConfig({ enableHandoffRedirect: false }),
    enableToasts: () => updateConfig({ showHandoffToasts: true }),
    disableToasts: () => updateConfig({ showHandoffToasts: false })
  }
}

// Pre-configured provider for common use cases
export function MobileFirstUXProviderStandard({ children }: { children: React.ReactNode }) {
  return (
    <MobileFirstUXProvider
      config={{
        bannerVariant: 'standard',
        pwaPromptTrigger: 'engagement',
        optimizationLevel: 'enhanced'
      }}
    >
      {children}
    </MobileFirstUXProvider>
  )
}

export function MobileFirstUXProviderAggressive({ children }: { children: React.ReactNode }) {
  return (
    <MobileFirstUXProvider
      config={{
        bannerVariant: 'compelling',
        pwaPromptTrigger: 'delayed',
        optimizationLevel: 'aggressive',
        autoGenerateQRCodes: true
      }}
    >
      {children}
    </MobileFirstUXProvider>
  )
}

export function MobileFirstUXProviderMinimal({ children }: { children: React.ReactNode }) {
  return (
    <MobileFirstUXProvider
      config={{
        bannerVariant: 'minimal',
        pwaPromptTrigger: 'manual',
        optimizationLevel: 'basic',
        showMobileBanner: false
      }}
    >
      {children}
    </MobileFirstUXProvider>
  )
}