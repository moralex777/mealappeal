'use client'

import React, { useState, useEffect } from 'react'
import { 
  Smartphone, 
  Camera, 
  Zap, 
  Star, 
  CheckCircle, 
  ArrowRight,
  QrCode,
  Download,
  Play,
  Users,
  TrendingUp,
  Award,
  Shield,
  Clock,
  Wifi,
  Bell,
  Target
} from 'lucide-react'
import { useDeviceDetection } from '@/lib/device-detection'
import { createMobileHandoff } from '@/lib/qr-handoff'
import { trackConversion, trackMobileBannerInteraction } from '@/lib/device-analytics'

interface DesktopLandingPageProps {
  variant?: 'hero' | 'features' | 'comparison' | 'testimonials' | 'benefits'
  showQRCode?: boolean
  autoGenerateQR?: boolean
  customContent?: {
    headline?: string
    subheadline?: string
    ctaText?: string
  }
}

interface QRCodeState {
  dataURL: string | null
  url: string | null
  isGenerating: boolean
  error: string | null
}

export function DesktopLandingPage({
  variant = 'hero',
  showQRCode = true,
  autoGenerateQR = false,
  customContent
}: DesktopLandingPageProps) {
  const { deviceInfo, features } = useDeviceDetection()
  const [qrCode, setQrCode] = useState<QRCodeState>({
    dataURL: null,
    url: null,
    isGenerating: false,
    error: null
  })
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)

  // Auto-generate QR code on mount if enabled
  useEffect(() => {
    if (autoGenerateQR && features.showMobileBanner) {
      generateQRCode()
    }
  }, [autoGenerateQR, features.showMobileBanner])

  const generateQRCode = async () => {
    if (qrCode.isGenerating) return

    setQrCode(prev => ({ ...prev, isGenerating: true, error: null }))
    
    try {
      const result = await createMobileHandoff(
        '/camera',
        {
          source: 'desktop_landing',
          variant,
          intent: 'mobile_adoption',
          timestamp: Date.now()
        },
        {
          size: 'large',
          style: 'branded',
          includeText: true
        }
      )

      setQrCode({
        dataURL: result.qrCodeDataURL,
        url: result.handoffUrl,
        isGenerating: false,
        error: null
      })

      // Track QR generation
      trackMobileBannerInteraction('qr_generated')
    } catch (error) {
      setQrCode({
        dataURL: null,
        url: null,
        isGenerating: false,
        error: 'Failed to generate QR code'
      })
    }
  }

  const handleMobileCTA = () => {
    if (!qrCode.dataURL) {
      generateQRCode()
    }
    
    trackConversion('mobile_switch', undefined, {
      source: 'desktop_landing',
      variant,
      cta_location: 'primary'
    })
  }

  // Don't show on mobile devices
  if (deviceInfo.isMobile) {
    return null
  }

  const mobileFeatures = [
    {
      icon: Camera,
      title: "Professional Camera Quality",
      description: "Mobile cameras outperform desktop webcams with better sensors, autofocus, and image stabilization for superior food photography.",
      stats: "10x better image quality"
    },
    {
      icon: Zap,
      title: "Lightning-Fast Analysis",
      description: "Optimized mobile processing delivers instant AI food analysis with real-time nutrition insights and ingredient recognition.",
      stats: "3x faster processing"
    },
    {
      icon: Target,
      title: "Touch-Optimized Interface",
      description: "Intuitive one-thumb operation designed specifically for mobile devices, making food tracking effortless and natural.",
      stats: "95% user satisfaction"
    },
    {
      icon: Wifi,
      title: "Offline Functionality",
      description: "Capture and store photos offline, then sync automatically when connected. Never lose a meal analysis again.",
      stats: "100% reliable"
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Personalized meal reminders, nutrition tips, and progress updates delivered exactly when you need them.",
      stats: "80% better adherence"
    },
    {
      icon: Shield,
      title: "Native App Security",
      description: "Bank-level security with biometric authentication and encrypted local storage for your personal health data.",
      stats: "Enterprise-grade"
    }
  ]

  const comparisonData = [
    {
      feature: "Camera Quality",
      desktop: "Basic webcam (1-3MP)",
      mobile: "Professional sensors (12-48MP)",
      advantage: "mobile"
    },
    {
      feature: "Image Processing",
      desktop: "Limited capabilities",
      mobile: "AI-optimized hardware",
      advantage: "mobile"
    },
    {
      feature: "User Experience",
      desktop: "Mouse & keyboard",
      mobile: "Natural touch gestures",
      advantage: "mobile"
    },
    {
      feature: "Portability",
      desktop: "Stationary use only",
      mobile: "Anywhere, anytime",
      advantage: "mobile"
    },
    {
      feature: "Offline Mode",
      desktop: "Requires internet",
      mobile: "Full offline capability",
      advantage: "mobile"
    },
    {
      feature: "Notifications",
      desktop: "Email only",
      mobile: "Push + Smart reminders",
      advantage: "mobile"
    }
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Nutritionist",
      avatar: "👩‍⚕️",
      quote: "The mobile camera quality makes all the difference. I can accurately assess my clients' meals with professional-grade photo analysis.",
      rating: 5
    },
    {
      name: "Mike Rodriguez",
      role: "Fitness Coach",
      avatar: "💪",
      quote: "Switched from desktop to mobile and wow! The speed and accuracy improvement is incredible. My meal tracking is now effortless.",
      rating: 5
    },
    {
      name: "Dr. Emily Watson",
      role: "Dietitian",
      avatar: "👩‍🔬",
      quote: "The offline functionality on mobile is game-changing. I can track meals anywhere and sync later. Perfect for busy professionals.",
      rating: 5
    }
  ]

  if (variant === 'hero') {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0fdf4 100%)',
        minHeight: '100vh',
        padding: '40px 20px'
      }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-green-600 font-medium">
                  <Star className="w-5 h-5 fill-current" />
                  <span>Recommended Experience</span>
                </div>
                
                <h1 className="text-5xl font-bold text-gray-900 leading-tight">
                  {customContent?.headline || 'Get 10x Better Food Analysis on Mobile'}
                </h1>
                
                <p className="text-xl text-gray-600 leading-relaxed">
                  {customContent?.subheadline || 'Professional photographers use mobile cameras for a reason. Experience superior food analysis with our camera-first mobile app.'}
                </p>
              </div>

              {/* Key Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mobileFeatures.slice(0, 4).map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white/70 rounded-lg">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{feature.title}</p>
                      <p className="text-sm text-green-600 font-medium">{feature.stats}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleMobileCTA}
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    borderRadius: '12px',
                    padding: '16px 32px',
                    fontSize: '18px',
                    fontWeight: '600',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    minWidth: '200px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(16, 185, 129, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0px)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  <QrCode className="w-6 h-6" />
                  {customContent?.ctaText || 'Switch to Mobile'}
                </button>

                <button
                  onClick={() => setShowVideoModal(true)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    color: '#1f2937',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '16px 32px',
                    fontSize: '18px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#10b981'
                    e.currentTarget.style.color = '#10b981'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e5e7eb'
                    e.currentTarget.style.color = '#1f2937'
                  }}
                >
                  <Play className="w-6 h-6" />
                  Watch Demo
                </button>
              </div>

              {/* Social Proof */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {['👩‍⚕️', '💪', '👩‍🔬', '👨‍🍳'].map((emoji, i) => (
                      <div key={i} className="w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-white text-sm">
                        {emoji}
                      </div>
                    ))}
                  </div>
                  <span className="text-gray-600 text-sm">
                    <strong className="text-gray-900">10,000+</strong> professionals trust MealAppeal
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                  <span className="text-gray-600 text-sm ml-1">4.9/5 rating</span>
                </div>
              </div>
            </div>

            {/* Right Content - QR Code & Visual */}
            <div className="relative">
              <div style={{
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: '24px',
                padding: '40px',
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)'
              }}>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    📱 Scan to Get Started
                  </h3>
                  <p className="text-gray-600">
                    Continue on your phone for the best experience
                  </p>
                </div>

                {qrCode.isGenerating ? (
                  <div className="flex flex-col items-center gap-4 p-8">
                    <div className="w-16 h-16 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin"></div>
                    <p className="text-gray-600">Generating your personal QR code...</p>
                  </div>
                ) : qrCode.dataURL ? (
                  <div>
                    <img
                      src={qrCode.dataURL}
                      alt="QR Code to continue on mobile"
                      className="w-48 h-48 mx-auto mb-4 cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => {
                        if (qrCode.url) {
                          navigator.clipboard.writeText(qrCode.url)
                          // Could show a toast notification here
                        }
                      }}
                    />
                    <p className="text-sm text-gray-600 mb-2">
                      Point your phone camera at the QR code
                    </p>
                    <p className="text-xs text-gray-500">
                      Or click to copy the link
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                      <QrCode className="w-12 h-12 text-gray-400" />
                    </div>
                    <button
                      onClick={generateQRCode}
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Generate QR Code
                    </button>
                    {qrCode.error && (
                      <p className="text-red-600 text-sm">{qrCode.error}</p>
                    )}
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">Why mobile?</p>
                  <div className="flex justify-center gap-4 text-xs text-gray-600">
                    <span>🔥 10x faster</span>
                    <span>📸 Better quality</span>
                    <span>📱 Native experience</span>
                  </div>
                </div>
              </div>

              {/* Floating stats */}
              <div className="absolute -top-4 -left-4 bg-white rounded-lg p-3 shadow-lg">
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-gray-900">95%</span>
                  <span className="text-gray-600">prefer mobile</span>
                </div>
              </div>

              <div className="absolute -bottom-4 -right-4 bg-white rounded-lg p-3 shadow-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-gray-900">3x</span>
                  <span className="text-gray-600">faster analysis</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Modal */}
        {showVideoModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '800px',
              width: '100%',
              position: 'relative'
            }}>
              <button
                onClick={() => setShowVideoModal(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
              
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Demo video would play here</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Showcasing mobile vs desktop food analysis experience
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (variant === 'comparison') {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Desktop vs Mobile: The Clear Winner
          </h2>
          <p className="text-xl text-gray-600">
            See why 95% of our users prefer the mobile experience
          </p>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
        }}>
          <div className="grid grid-cols-3 bg-gray-50 p-4 font-semibold text-gray-900">
            <div>Feature</div>
            <div className="text-center">Desktop Experience</div>
            <div className="text-center text-green-600">Mobile Experience ⭐</div>
          </div>

          {comparisonData.map((item, index) => (
            <div key={index} className={`grid grid-cols-3 p-4 border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
              <div className="font-medium text-gray-900">{item.feature}</div>
              <div className="text-center text-gray-600">{item.desktop}</div>
              <div className="text-center">
                <span className="text-green-600 font-medium">{item.mobile}</span>
                {item.advantage === 'mobile' && (
                  <CheckCircle className="w-4 h-4 text-green-600 inline ml-2" />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <button
            onClick={handleMobileCTA}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              borderRadius: '12px',
              padding: '16px 32px',
              fontSize: '18px',
              fontWeight: '600',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <Smartphone className="w-6 h-6" />
            Experience Mobile Excellence
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    )
  }

  if (variant === 'testimonials') {
    return (
      <div className="max-w-6xl mx-auto p-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            What Professionals Say About Mobile
          </h2>
          <p className="text-xl text-gray-600">
            Trusted by nutritionists, dietitians, and fitness experts worldwide
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} style={{
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center text-lg">
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>

              <div className="flex mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                ))}
              </div>

              <p className="text-gray-700 italic">"{testimonial.quote}"</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-4 bg-green-50 rounded-full px-6 py-3 mb-6">
            <Award className="w-6 h-6 text-green-600" />
            <span className="text-green-800 font-medium">
              Rated #1 Mobile Food Analysis App by Professionals
            </span>
          </div>

          <div>
            <button
              onClick={handleMobileCTA}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                borderRadius: '12px',
                padding: '16px 32px',
                fontSize: '18px',
                fontWeight: '600',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <QrCode className="w-6 h-6" />
              Join the Professionals
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Default features variant
  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Why Mobile Delivers Superior Results
        </h2>
        <p className="text-xl text-gray-600">
          Every aspect is optimized for the best food analysis experience
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {mobileFeatures.map((feature, index) => (
          <div
            key={index}
            style={{
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0px)'
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)'
            }}
            onClick={() => setActiveFeature(index)}
          >
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '12px',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px'
            }}>
              <feature.icon className="w-6 h-6 text-white" />
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {feature.title}
            </h3>

            <p className="text-gray-600 mb-4 leading-relaxed">
              {feature.description}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-green-600 font-semibold text-sm">
                {feature.stats}
              </span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-12">
        <button
          onClick={handleMobileCTA}
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            borderRadius: '12px',
            padding: '20px 40px',
            fontSize: '20px',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)'
          }}
        >
          <QrCode className="w-6 h-6" />
          Experience These Features Now
          <ArrowRight className="w-6 h-6" />
        </button>

        {showQRCode && qrCode.dataURL && (
          <div className="mt-8 inline-block">
            <div style={{
              background: 'rgba(255, 255, 255, 0.9)',
              borderRadius: '16px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <img
                src={qrCode.dataURL}
                alt="QR Code for mobile access"
                className="w-32 h-32 mx-auto"
              />
              <p className="text-sm text-gray-600 mt-2">
                Scan to continue on mobile
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Export pre-configured variants for easy use
export function DesktopHeroLanding(props: Omit<DesktopLandingPageProps, 'variant'>) {
  return <DesktopLandingPage {...props} variant="hero" />
}

export function DesktopFeaturesLanding(props: Omit<DesktopLandingPageProps, 'variant'>) {
  return <DesktopLandingPage {...props} variant="features" />
}

export function DesktopComparisonLanding(props: Omit<DesktopLandingPageProps, 'variant'>) {
  return <DesktopLandingPage {...props} variant="comparison" />
}

export function DesktopTestimonialsLanding(props: Omit<DesktopLandingPageProps, 'variant'>) {
  return <DesktopLandingPage {...props} variant="testimonials" />
}