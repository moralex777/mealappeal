'use client'

import { Camera, Check, Crown, Sparkles, Star, TrendingUp, Zap } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { AppLayout } from '@/components/AppLayout'
import ErrorBoundary from '@/components/ErrorBoundary'
import { useAuth } from '@/contexts/AuthContext'

export default function UpgradePage(): React.ReactNode {
  const { user, loading: authLoading, profile } = useAuth()
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('🔄 No user found, redirecting to login...')
      window.location.href = '/login'
    }
  }, [authLoading, user])

  // Handle chunk loading errors
  useEffect(() => {
    const handleChunkError = (event: ErrorEvent) => {
      if (event.message.includes('Loading chunk') || event.message.includes('ChunkLoadError')) {
        console.log('🔄 Chunk loading error detected, reloading...')
        window.location.reload()
      }
    }

    window.addEventListener('error', handleChunkError)
    return () => window.removeEventListener('error', handleChunkError)
  }, [])

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <AppLayout>
        <div
          style={{
            minHeight: '100vh',
            background:
              'linear-gradient(135deg, #f9fafb 0%, #f3e8ff 25%, #fce7f3 50%, #fff7ed 75%, #f0fdf4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                border: '4px solid #e5e7eb',
                borderTop: '4px solid #10b981',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 24px',
              }}
            />
            <h2
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                background: 'linear-gradient(to right, #10b981, #ea580c)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0,
              }}
            >
              Loading Your Account...
            </h2>
            <p style={{ color: '#6b7280', margin: '12px 0 0 0' }}>
              Preparing your upgrade options
            </p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const handleSubscribe = async (planType: 'monthly' | 'yearly'): Promise<void> => {
    try {
      setLoading(planType)
      setError(null)

      // Wait for auth to load if still loading
      if (authLoading) {
        setError('Please wait, loading user information...')
        setLoading(null)
        return
      }

      // Double-check - wait a bit more if auth just finished but user object might be incomplete
      if (user && !user.email) {
        console.log('⚠️ User object incomplete, retrying...')
        setError('Preparing user account... Please try again.')
        setLoading(null)
        return
      }

      if (!user?.id) {
        console.log('🔍 No user found, redirecting to login')
        setError('Please sign in to upgrade your account')
        setLoading(null)
        setTimeout(() => {
          window.location.href = '/login'
        }, 2000)
        return
      }

      if (!user?.email) {
        console.error('❌ User missing email:', user)
        setError('User account missing email. Please contact support.')
        setLoading(null)
        return
      }

      console.log('🚀 Starting subscription for user:', user.id, 'email:', user.email, 'plan:', planType)

      // Additional check to ensure user is fully loaded
      if (!user.user_metadata && !user.app_metadata) {
        console.log('⚠️ User metadata not fully loaded, waiting...')
        setError('Loading user information... Please wait.')
        setLoading(null)
        return
      }

      // Create Stripe Checkout Session via our API
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          planType,
        }),
      })

      console.log('📡 Checkout API response:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('❌ Checkout API error:', errorData)
        
        // More specific error handling
        if (response.status === 404) {
          throw new Error('User profile not found. Please try refreshing the page.')
        } else if (response.status === 401) {
          throw new Error('Authentication failed. Please sign in again.')
        } else if (response.status === 400) {
          throw new Error(errorData.error || 'Invalid subscription request')
        }
        
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()
      console.log('✅ Checkout URL received:', url)

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url
      } else {
        throw new Error('No checkout URL received')
      }
    } catch (err: any) {
      console.error('❌ Error starting subscription:', err)
      setError(err.message || '😅 Oops! Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <ErrorBoundary>
      <AppLayout>
        <div
          style={{
            minHeight: '100vh',
            background:
              'linear-gradient(135deg, #f9fafb 0%, #f3e8ff 25%, #fce7f3 50%, #fff7ed 75%, #f0fdf4 100%)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {/* Main Content */}
          <div
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '48px 24px',
            }}
          >
            {/* Hero Section */}
            <div
              style={{
                textAlign: 'center',
                marginBottom: '64px',
              }}
            >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              background: 'linear-gradient(to right, #10b981, #ea580c)',
              borderRadius: '24px',
              padding: '8px 24px',
              marginBottom: '24px',
              boxShadow: '0 8px 15px rgba(16, 185, 129, 0.3)',
            }}
          >
            <Crown style={{ width: '20px', height: '20px', color: 'white' }} />
            <span style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>
              Premium Membership
            </span>
          </div>

          <h1
            style={{
              fontSize: '56px',
              fontWeight: 'bold',
              marginBottom: '24px',
              lineHeight: '1.1',
            }}
          >
            <span
              style={{
                background: 'linear-gradient(to right, #10b981, #ea580c)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Unlock Your Full Potential
            </span>
            <span
              style={{ display: 'block', fontSize: '32px', color: '#6b7280', marginTop: '12px' }}
            >
              Transform every meal into insights 🚀
            </span>
          </h1>

          <p
            style={{
              fontSize: '20px',
              color: '#6b7280',
              maxWidth: '700px',
              margin: '0 auto 48px',
              lineHeight: '1.6',
            }}
          >
            Start your smart nutrition journey with
            USDA scientific nutrition data, detailed analysis, and personalized recommendations
          </p>

          {/* Trust Indicators */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '48px',
              marginBottom: '48px',
              flexWrap: 'wrap',
            }}
          >
            {[
              { icon: Star, label: 'Growing', sublabel: 'Community' },
              { icon: TrendingUp, label: '95%', sublabel: 'Success Rate' },
              { icon: Zap, label: '24/7', sublabel: 'Analysis' },
            ].map((stat, idx) => (
              <div key={idx} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    background: 'linear-gradient(to right, #10b981, #ea580c)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                    boxShadow: '0 8px 15px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <stat.icon style={{ width: '28px', height: '28px', color: 'white' }} />
                </div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>
                  {stat.label}
                </div>
                <div style={{ fontSize: '16px', color: '#6b7280' }}>{stat.sublabel}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '32px',
            maxWidth: '800px',
            margin: '0 auto 64px',
          }}
        >
          {/* Monthly Plan */}
          <div
            style={{
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
              padding: '40px',
              backdropFilter: 'blur(12px)',
              position: 'relative',
              transition: 'transform 0.3s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.02)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            <h3
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: '16px',
              }}
            >
              Monthly Premium
            </h3>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '24px', textDecoration: 'line-through', color: '#9ca3af' }}>$9.99</span>
              </div>
              <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#10b981' }}>$4.99</span>
              <span style={{ fontSize: '20px', color: '#6b7280' }}>/month</span>
            </div>

            <button
              onClick={() => handleSubscribe('monthly')}
              disabled={loading === 'monthly' || authLoading}
              style={{
                width: '100%',
                padding: '18px',
                borderRadius: '16px',
                border: 'none',
                background:
                  loading === 'monthly' ? '#d1d5db' : 'linear-gradient(to right, #6b7280, #4b5563)',
                color: 'white',
                fontSize: '18px',
                fontWeight: '600',
                cursor: loading === 'monthly' ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 15px rgba(0, 0, 0, 0.2)',
                marginBottom: '32px',
              }}
              onMouseEnter={e => {
                if (loading !== 'monthly') {
                  e.currentTarget.style.transform = 'scale(1.02)'
                  e.currentTarget.style.boxShadow = '0 12px 20px rgba(0, 0, 0, 0.3)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.2)'
              }}
            >
              {loading === 'monthly' ? (
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    border: '3px solid white',
                    borderTop: '3px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto',
                  }}
                />
              ) : (
                'Start Monthly Plan'
              )}
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                'Unlimited meal storage',
                'USDA scientific nutrition data',
                'Advanced nutrition insights',
                'Smart meal recommendations',
                'Detailed macro breakdowns',
                'Meal history tracking',
                'Priority support',
              ].map((feature, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Check style={{ width: '20px', height: '20px', color: '#10b981' }} />
                  <span style={{ color: '#1f2937', fontSize: '16px' }}>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Yearly Plan - PROMOTED */}
          <div
            style={{
              borderRadius: '24px',
              background:
                'linear-gradient(to bottom right, rgba(16, 185, 129, 0.05), rgba(234, 88, 12, 0.05))',
              boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15), 0 0 0 3px rgba(16, 185, 129, 0.5)',
              padding: '40px',
              backdropFilter: 'blur(12px)',
              position: 'relative',
              transform: 'scale(1.05)',
              transition: 'transform 0.3s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.07)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1.05)'
            }}
          >
            {/* Best Value Badge */}
            <div
              style={{
                position: 'absolute',
                top: '-16px',
                left: '50%',
                transform: 'translateX(-50%)',
                background: 'linear-gradient(to right, #10b981, #ea580c)',
                padding: '8px 24px',
                borderRadius: '24px',
                boxShadow: '0 8px 15px rgba(16, 185, 129, 0.3)',
              }}
            >
              <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>
                🎉 SAVE 17% - BEST VALUE
              </span>
            </div>

            {/* Popular Badge */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'linear-gradient(to right, #ea580c, #dc2626)',
                padding: '6px 16px',
                borderRadius: '16px',
                boxShadow: '0 4px 10px rgba(234, 88, 12, 0.3)',
              }}
            >
              <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                MOST POPULAR
              </span>
            </div>

            <div
              style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}
            >
              <Sparkles style={{ width: '24px', height: '24px', color: '#10b981' }} />
              <h3
                style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(to right, #10b981, #ea580c)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Yearly Premium
              </h3>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '28px', textDecoration: 'line-through', color: '#9ca3af' }}>$99.99</span>
              </div>
              <span
                style={{
                  fontSize: '56px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(to right, #10b981, #ea580c)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                $49.99
              </span>
              <span style={{ fontSize: '20px', color: '#6b7280' }}>/year</span>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <span style={{ fontSize: '18px', color: '#10b981', fontWeight: '600' }}>
                Only $4.17/month • Save $9.89 vs monthly
              </span>
            </div>

            <button
              onClick={() => handleSubscribe('yearly')}
              disabled={loading === 'yearly' || authLoading}
              style={{
                width: '100%',
                padding: '20px',
                borderRadius: '16px',
                border: 'none',
                background:
                  loading === 'yearly' ? '#d1d5db' : 'linear-gradient(to right, #10b981, #ea580c)',
                color: 'white',
                fontSize: '20px',
                fontWeight: 'bold',
                cursor: loading === 'yearly' ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 15px rgba(16, 185, 129, 0.3)',
                marginBottom: '32px',
                animation: loading !== 'yearly' ? 'pulse 2s infinite' : 'none',
              }}
              onMouseEnter={e => {
                if (loading !== 'yearly') {
                  e.currentTarget.style.transform = 'scale(1.02)'
                  e.currentTarget.style.boxShadow = '0 12px 20px rgba(16, 185, 129, 0.4)'
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 8px 15px rgba(16, 185, 129, 0.3)'
              }}
            >
              {loading === 'yearly' ? (
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    border: '3px solid white',
                    borderTop: '3px solid transparent',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto',
                  }}
                />
              ) : (
                '🚀 Start Yearly Plan - SAVE 17%'
              )}
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                'Unlimited meal storage',
                'USDA scientific nutrition data',
                'Advanced nutrition insights',
                'Smart meal recommendations',
                'Detailed macro breakdowns',
                'Meal history tracking',
                'Priority support',
              ].map((feature, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      background: 'linear-gradient(to right, #10b981, #ea580c)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Check style={{ width: '16px', height: '16px', color: 'white' }} />
                  </div>
                  <span style={{ color: '#1f2937', fontSize: '16px', fontWeight: '500' }}>
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trust & Security */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '48px',
          }}
        >
          <div style={{ marginBottom: '24px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '18px',
                fontWeight: '600',
                color: '#10b981',
              }}
            >
              💝 Best Value: Save with yearly plan
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '24px',
              flexWrap: 'wrap',
              color: '#6b7280',
              fontSize: '16px',
            }}
          >
            <span>🔒 Secure payments by Stripe</span>
            <span>•</span>
            <span>🚀 New features added regularly</span>
            <span>•</span>
            <span>🔒 Lock in early adopter pricing</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              maxWidth: '600px',
              margin: '0 auto',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '2px solid #ef4444',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                color: '#dc2626',
                fontSize: '18px',
                fontWeight: '500',
                marginBottom: '8px',
              }}
            >
              {error}
            </div>
            <div style={{ color: '#ef4444', fontSize: '14px' }}>
              Try refreshing the page or contact support if the issue persists.
            </div>
          </div>
        )}
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.9;
            transform: scale(1.01);
          }
        }
      `}</style>
        </div>
      </AppLayout>
    </ErrorBoundary>
  )
}
