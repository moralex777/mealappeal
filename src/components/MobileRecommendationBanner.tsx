'use client'

import { X, Smartphone, Camera, Zap, Star, ArrowRight, Scan, Download } from 'lucide-react'
import { usePathname } from 'next/navigation'
import React, { useState, useEffect } from 'react'

import { useDeviceDetection } from '@/lib/device-detection'
import { createMobileHandoff } from '@/lib/qr-handoff'


interface MobileRecommendationBannerProps {
  variant?: 'minimal' | 'standard' | 'compelling' | 'urgent'
  position?: 'top' | 'bottom' | 'floating'
  showOnce?: boolean
  customMessage?: string
  trackingContext?: Record<string, any>
}

interface QRCodeData {
  dataURL: string
  url: string
  sessionId: string
  expiresIn: number
}

export function MobileRecommendationBanner({
  variant = 'compelling',
  position = 'top',
  showOnce = true,
  customMessage,
  trackingContext = {}
}: MobileRecommendationBannerProps) {
  const { deviceInfo, mobileExperience, features } = useDeviceDetection()
  const pathname = usePathname()
  
  const [isVisible, setIsVisible] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [qrCode, setQrCode] = useState<QRCodeData | null>(null)
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)
  const [dismissedAt, setDismissedAt] = useState<number | null>(null)

  // Check if banner should be shown
  useEffect(() => {
    if (!features.showMobileBanner) {
      setIsVisible(false)
      return
    }

    // Check localStorage for dismissal
    const storageKey = `mobile-banner-dismissed-${variant}`
    const dismissed = localStorage.getItem(storageKey)
    
    if (showOnce && dismissed) {
      const dismissTime = parseInt(dismissed)
      const hoursSinceDismiss = (Date.now() - dismissTime) / (1000 * 60 * 60)
      
      // Show again after 24 hours for compelling variants, 7 days for others
      const hoursThreshold = variant === 'compelling' || variant === 'urgent' ? 24 : 168
      
      if (hoursSinceDismiss < hoursThreshold) {
        setIsVisible(false)
        return
      }
    }

    setIsVisible(true)
  }, [features.showMobileBanner, variant, showOnce])

  // Generate QR code when banner is expanded
  useEffect(() => {
    if (isExpanded && !qrCode && !isGeneratingQR) {
      generateQRCode()
    }
  }, [isExpanded, qrCode, isGeneratingQR])

  const generateQRCode = async () => {
    setIsGeneratingQR(true)
    try {
      const result = await createMobileHandoff(
        pathname,
        {
          ...trackingContext,
          bannerVariant: variant,
          deviceInfo,
          timestamp: Date.now()
        },
        {
          size: 'medium',
          style: 'branded',
          includeText: true
        }
      )
      
      setQrCode({
        dataURL: result.qrCodeDataURL,
        url: result.handoffUrl,
        sessionId: result.sessionId,
        expiresIn: result.expiresIn
      })
    } catch (error) {
      console.error('Failed to generate QR code:', error)
    } finally {
      setIsGeneratingQR(false)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    const dismissTime = Date.now()
    setDismissedAt(dismissTime)
    
    if (showOnce) {
      const storageKey = `mobile-banner-dismissed-${variant}`
      localStorage.setItem(storageKey, dismissTime.toString())
    }

    // Track dismissal
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'mobile_banner_dismissed', {
        variant,
        device_type: 'desktop',
        session_id: qrCode?.sessionId
      })
    }
  }

  const handleExpand = () => {
    setIsExpanded(!isExpanded)
    
    // Track expansion
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'mobile_banner_expanded', {
        variant,
        device_type: 'desktop'
      })
    }
  }

  const handleQRCodeClick = () => {
    if (qrCode) {
      // Copy URL to clipboard
      navigator.clipboard.writeText(qrCode.url)
      
      // Track QR code interaction
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'qr_code_clicked', {
          session_id: qrCode.sessionId,
          variant,
          device_type: 'desktop'
        })
      }
    }
  }

  if (!isVisible) {return null}

  const getBannerContent = () => {
    switch (variant) {
      case 'minimal':
        return {
          title: '📱 Better on mobile',
          subtitle: 'Get the best camera experience',
          benefits: ['Superior photo quality', 'Touch-optimized interface']
        }
      
      case 'standard':
        return {
          title: '📸 Unlock the full MealAppeal experience',
          subtitle: 'Switch to mobile for optimal food analysis',
          benefits: [
            'Higher quality food photos',
            'Real-time camera preview',
            'Touch-friendly interface',
            'Offline photo storage'
          ]
        }
      
      case 'compelling':
        return {
          title: '🚀 Get 10x better food analysis on mobile!',
          subtitle: 'Professional photographers use mobile cameras for a reason',
          benefits: [
            '📸 Professional-grade camera quality',
            '⚡ Lightning-fast photo analysis',
            '🎯 One-thumb optimized interface',
            '💾 Offline storage & sync',
            '🔔 Smart meal reminders',
            '📍 Location-based insights'
          ]
        }
      
      case 'urgent':
        return {
          title: '⚠️ You\'re missing out on premium features!',
          subtitle: 'Desktop cameras provide limited food analysis accuracy',
          benefits: [
            '❌ Desktop: Basic analysis only',
            '✅ Mobile: Professional insights',
            '❌ Desktop: No offline storage',
            '✅ Mobile: Full offline experience',
            '❌ Desktop: Limited camera quality',
            '✅ Mobile: 4K+ photo analysis'
          ]
        }
    }
  }

  const content = getBannerContent()
  const positionClasses = {
    top: 'top-0',
    bottom: 'bottom-0',
    floating: 'top-4'
  }

  const containerClasses = `
    fixed ${positionClasses[position]} left-0 right-0 z-50
    ${position === 'floating' ? 'mx-4' : 'mx-0'}
  `

  return (
    <div className={containerClasses}>
      <div style={{
        background: 'linear-gradient(135deg, #10b981 0%, #ea580c 100%)',
        backdropFilter: 'blur(8px)',
        borderRadius: position === 'floating' ? '12px' : '0px',
        padding: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div className="flex items-start justify-between gap-4">
          {/* Content Section */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              
              <div>
                <h3 className="text-white font-semibold text-lg leading-tight">
                  {customMessage || content.title}
                </h3>
                <p className="text-white/90 text-sm">
                  {content.subtitle}
                </p>
              </div>
              
              {variant === 'compelling' && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'white'
                }}>
                  ⭐ RECOMMENDED
                </div>
              )}
            </div>

            {/* Benefits List */}
            {!isExpanded && (
              <div className="grid grid-cols-2 gap-1 mb-3">
                {content.benefits.slice(0, 2).map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2 text-white/90 text-sm">
                    <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                    {benefit}
                  </div>
                ))}
              </div>
            )}

            {isExpanded && (
              <div className="space-y-2 mb-4">
                {content.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2 text-white/90 text-sm">
                    <div className="w-1.5 h-1.5 bg-white/80 rounded-full"></div>
                    {benefit}
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleExpand}
                style={{
                  background: 'rgba(255, 255, 255, 0.9)',
                  color: '#1f2937',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 1)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'
                  e.currentTarget.style.transform = 'translateY(0px)'
                }}
              >
                <Scan className="w-4 h-4" />
                {isExpanded ? 'Show QR Code' : 'Switch to Mobile'}
                <ArrowRight className="w-4 h-4" />
              </button>

              {!isExpanded && (
                <button
                  onClick={handleExpand}
                  className="text-white/80 text-sm underline hover:text-white transition-colors"
                >
                  See all benefits
                </button>
              )}
            </div>
          </div>

          {/* QR Code Section */}
          {isExpanded && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
              minWidth: '200px'
            }}>
              {isGeneratingQR ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-600">Generating QR code...</p>
                </div>
              ) : qrCode ? (
                <div>
                  <img
                    src={qrCode.dataURL}
                    alt="QR Code for mobile access"
                    className="w-32 h-32 mx-auto mb-2 cursor-pointer hover:scale-105 transition-transform"
                    onClick={handleQRCodeClick}
                  />
                  <p className="text-xs text-gray-600 mb-2">
                    Scan with your phone to continue
                  </p>
                  <p className="text-xs text-gray-500">
                    Expires in {Math.round(qrCode.expiresIn / 60000)} minutes
                  </p>
                  <button
                    onClick={handleQRCodeClick}
                    className="text-xs text-green-600 hover:text-green-700 mt-1"
                  >
                    Copy link instead
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Camera className="w-8 h-8 text-gray-400" />
                  <p className="text-sm text-gray-600">QR code failed to load</p>
                </div>
              )}
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              padding: '4px',
              border: 'none',
              cursor: 'pointer',
              color: 'white',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// Hook for programmatic banner control
export function useMobileBanner() {
  const { features } = useDeviceDetection()
  
  const showBanner = (variant: MobileRecommendationBannerProps['variant'] = 'standard') => {
    if (!features.showMobileBanner) {return false}
    
    // Clear any existing dismissal
    const storageKey = `mobile-banner-dismissed-${variant}`
    localStorage.removeItem(storageKey)
    
    return true
  }
  
  const hideBanner = (variant: MobileRecommendationBannerProps['variant'] = 'standard') => {
    const storageKey = `mobile-banner-dismissed-${variant}`
    localStorage.setItem(storageKey, Date.now().toString())
  }
  
  return {
    shouldShowBanner: features.showMobileBanner,
    showBanner,
    hideBanner
  }
}

// Pre-configured banner variants for easy use
export function MobileBannerMinimal(props: Omit<MobileRecommendationBannerProps, 'variant'>) {
  return <MobileRecommendationBanner {...props} variant="minimal" />
}

export function MobileBannerStandard(props: Omit<MobileRecommendationBannerProps, 'variant'>) {
  return <MobileRecommendationBanner {...props} variant="standard" />
}

export function MobileBannerCompelling(props: Omit<MobileRecommendationBannerProps, 'variant'>) {
  return <MobileRecommendationBanner {...props} variant="compelling" />
}

export function MobileBannerUrgent(props: Omit<MobileRecommendationBannerProps, 'variant'>) {
  return <MobileRecommendationBanner {...props} variant="urgent" />
}