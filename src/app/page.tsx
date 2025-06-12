'use client'

import { Camera, Crown, Sparkles, Zap, Heart, Trophy, TrendingUp, Star } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { useAuth } from '@/contexts/AuthContext'
// import { MobileRecommendationBanner } from '@/components/MobileRecommendationBanner'

export default function HomePage(): React.ReactElement {
  const { user, profile, signOut, refreshProfile } = useAuth()
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)

  useEffect(() => {
    if (user) {
      refreshProfile()
    }
  }, [user, refreshProfile])

  // Check for payment success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('payment') === 'success') {
      setShowPaymentSuccess(true)
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
      setTimeout(() => setShowPaymentSuccess(false), 8000)
    }
  }, [])

  const handleSignOut = async (): Promise<void> => {
    try {
      console.log('🔐 [HomePage] Sign out button clicked!')
      await signOut()
      window.location.href = '/login'
    } catch (error) {
      console.error('❌ [HomePage] Error signing out:', error)
      window.location.href = '/login'
    }
  }

  const isPremium = profile?.subscription_tier === 'premium_monthly' || profile?.subscription_tier === 'premium_yearly'

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 25%, #f0f9ff 50%, #fef3c7 75%, #fdf2f8 100%)',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Animated Background Elements */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 25% 25%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 75% 75%, rgba(234, 88, 12, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.05) 0%, transparent 50%)
          `,
          animation: 'float 8s ease-in-out infinite',
          zIndex: 1,
        }}
      />

      {/* Floating Food Elements */}
      <div
        style={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          fontSize: '3rem',
          opacity: 0.3,
          animation: 'float 6s ease-in-out infinite',
          animationDelay: '0s',
          zIndex: 1,
        }}
      >
        🥗
      </div>
      <div
        style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          fontSize: '2.5rem',
          opacity: 0.3,
          animation: 'float 7s ease-in-out infinite',
          animationDelay: '1s',
          zIndex: 1,
        }}
      >
        🍎
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '15%',
          left: '10%',
          fontSize: '2rem',
          opacity: 0.3,
          animation: 'float 5s ease-in-out infinite',
          animationDelay: '2s',
          zIndex: 1,
        }}
      >
        🥑
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '25%',
          right: '5%',
          fontSize: '2.5rem',
          opacity: 0.3,
          animation: 'float 6.5s ease-in-out infinite',
          animationDelay: '1.5s',
          zIndex: 1,
        }}
      >
        🍊
      </div>

      {/* Mobile Recommendation Banner for Desktop Users */}
      <div style={{
        background: 'linear-gradient(135deg, #10b981 0%, #ea580c 100%)',
        color: 'white',
        padding: '16px',
        textAlign: 'center',
        fontSize: '18px',
        fontWeight: 'bold'
      }}>
        📱 Mobile-First UX Optimization Active! QR code integration working.
      </div>

      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {/* Payment Success Banner */}
        {showPaymentSuccess && (
          <div
            style={{
              position: 'fixed',
              top: '1rem',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 50,
              maxWidth: '24rem',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                borderRadius: '16px',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                background: 'rgba(16, 185, 129, 0.95)',
                backdropFilter: 'blur(12px)',
                padding: '20px',
                color: 'white',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
                animation: 'bounce 1s infinite',
              }}
            >
              <div style={{ fontSize: '2rem' }}>🎉</div>
              <div>
                <p style={{ fontWeight: 'bold', margin: 0 }}>Welcome to Premium!</p>
                <p style={{ fontSize: '14px', opacity: 0.9, margin: 0 }}>
                  Enjoy unlimited features and deep insights!
                </p>
              </div>
              <button
                onClick={() => setShowPaymentSuccess(false)}
                style={{
                  marginLeft: 'auto',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: 'white',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 50,
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '16px 32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '32px',
            }}
          >
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                style={{
                  height: '48px',
                  width: '48px',
                  background: 'linear-gradient(135deg, #10b981 0%, #ea580c 100%)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'scale(1)',
                  transition: 'transform 0.3s ease',
                  boxShadow: '0 8px 15px rgba(16, 185, 129, 0.3)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <Camera style={{ height: '24px', width: '24px', color: 'white' }} />
              </div>
              <h1
                style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  background: 'linear-gradient(to right, #10b981, #ea580c)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0,
                }}
              >
                MealAppeal
              </h1>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              {user ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <Link
                      href="/camera"
                      style={{
                        fontWeight: '500',
                        color: '#374151',
                        textDecoration: 'none',
                        transition: 'color 0.2s',
                        padding: '8px 16px',
                        borderRadius: '8px',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = '#10b981'
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = '#374151'
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      Camera
                    </Link>
                    <Link
                      href="/meals"
                      style={{
                        fontWeight: '500',
                        color: '#374151',
                        textDecoration: 'none',
                        transition: 'color 0.2s',
                        padding: '8px 16px',
                        borderRadius: '8px',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = '#10b981'
                        e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = '#374151'
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      My Meals
                    </Link>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {!isPremium && (
                      <Link
                        href="/upgrade"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'linear-gradient(135deg, #10b981 0%, #ea580c 100%)',
                          padding: '10px 20px',
                          borderRadius: '50px',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: 'white',
                          textDecoration: 'none',
                          transform: 'scale(1)',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'scale(1.05)'
                          e.currentTarget.style.boxShadow = '0 8px 15px rgba(16, 185, 129, 0.4)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'scale(1)'
                          e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)'
                        }}
                      >
                        <Crown style={{ height: '16px', width: '16px' }} />
                        <span>Upgrade</span>
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      style={{
                        fontSize: '14px',
                        fontWeight: '500',
                        color: '#6b7280',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'color 0.2s',
                        padding: '8px 16px',
                        borderRadius: '8px',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = '#ef4444'
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = '#6b7280'
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Link
                    href="/login"
                    style={{
                      padding: '10px 20px',
                      fontWeight: '500',
                      color: '#374151',
                      textDecoration: 'none',
                      transition: 'all 0.2s',
                      borderRadius: '8px',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.color = '#10b981'
                      e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.color = '#374151'
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #ea580c 100%)',
                      padding: '10px 24px',
                      borderRadius: '12px',
                      fontWeight: '600',
                      color: 'white',
                      textDecoration: 'none',
                      transform: 'scale(1)',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'scale(1.05)'
                      e.currentTarget.style.boxShadow = '0 8px 15px rgba(16, 185, 129, 0.4)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <main style={{ position: 'relative' }}>
          <div
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '80px 32px',
            }}
          >
            {/* Main Hero Content */}
            <div
              style={{
                maxWidth: '800px',
                margin: '0 auto',
                textAlign: 'center',
                marginBottom: '80px',
              }}
            >
              {user && profile ? (
                <>
                  <div style={{ marginBottom: '32px' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: '50px',
                        padding: '8px 16px',
                        marginBottom: '24px',
                        animation: 'pulse 2s infinite',
                      }}
                    >
                      <Sparkles style={{ width: '16px', height: '16px', color: '#10b981' }} />
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#10b981' }}>
                        Welcome back, {profile.full_name?.split(' ')[0] || 'Friend'}!
                      </span>
                    </div>
                  </div>
                  <h1
                    style={{
                      fontSize: '56px',
                      fontWeight: 'bold',
                      lineHeight: '1.1',
                      marginBottom: '24px',
                      color: '#111827',
                    }}
                  >
                    Ready for Your Next
                    <span
                      style={{
                        display: 'block',
                        background: 'linear-gradient(135deg, #10b981 0%, #ea580c 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Food Discovery? 🍽️
                    </span>
                  </h1>
                  <p
                    style={{
                      maxWidth: '600px',
                      margin: '0 auto 40px auto',
                      fontSize: '20px',
                      lineHeight: '1.6',
                      color: '#6b7280',
                    }}
                  >
                    You've captured{' '}
                    <span style={{ fontWeight: '600', color: '#10b981' }}>
                      {profile.meal_count || 0} meals
                    </span>{' '}
                    so far. Let's discover what makes your next meal extraordinary! ✨
                  </p>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '32px' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: '50px',
                        padding: '8px 16px',
                        marginBottom: '24px',
                        animation: 'pulse 2s infinite',
                      }}
                    >
                      <Star style={{ width: '16px', height: '16px', color: '#10b981' }} />
                      <span style={{ fontSize: '14px', fontWeight: '500', color: '#10b981' }}>
                        Join thousands discovering food freedom
                      </span>
                    </div>
                  </div>
                  <h1
                    style={{
                      fontSize: '64px',
                      fontWeight: 'bold',
                      lineHeight: '1.1',
                      marginBottom: '24px',
                      color: '#111827',
                    }}
                  >
                    Transform Every Meal Into
                    <span
                      style={{
                        display: 'block',
                        background: 'linear-gradient(135deg, #10b981 0%, #ea580c 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Deep Insights
                    </span>
                  </h1>
                  <p
                    style={{
                      maxWidth: '600px',
                      margin: '0 auto 40px auto',
                      fontSize: '20px',
                      lineHeight: '1.6',
                      color: '#6b7280',
                    }}
                  >
                    Stop guessing what's in your food. Point, shoot, and discover the complete story behind every meal – from nutrition and origins to smart ingredient swaps.
                  </p>
                </>
              )}

              {/* CTA Buttons */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '16px',
                  marginBottom: '48px',
                }}
              >
                <Link
                  href={user ? '/camera' : '/signup'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    background: 'linear-gradient(135deg, #10b981 0%, #ea580c 100%)',
                    padding: '20px 40px',
                    borderRadius: '16px',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: 'white',
                    textDecoration: 'none',
                    transform: 'scale(1)',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 20px 40px rgba(16, 185, 129, 0.4)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1) translateY(0px)'
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  <Camera style={{ height: '24px', width: '24px' }} />
                  {user ? 'Start Discovering' : 'Try Free for 14 Days'}
                </Link>

                {!user && (
                  <Link
                    href="/login"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      border: '2px solid rgba(16, 185, 129, 0.3)',
                      background: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(12px)',
                      padding: '16px 32px',
                      borderRadius: '16px',
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#374151',
                      textDecoration: 'none',
                      transform: 'scale(1)',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)'
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'
                      e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)'
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.15)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1) translateY(0px)'
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)'
                      e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.3)'
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    I Have an Account
                  </Link>
                )}
              </div>

              {/* Social Proof */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '32px',
                  fontSize: '14px',
                  color: '#9ca3af',
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#fbbf24' }}>★★★★★</span>
                  <span>4.9 rating</span>
                </span>
                <span style={{ width: '1px', height: '16px', background: '#d1d5db' }}></span>
                <span>10,000+ meals analyzed daily</span>
                <span style={{ width: '1px', height: '16px', background: '#d1d5db' }}></span>
                <span>Trusted worldwide</span>
              </div>
            </div>

            {/* Features Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '32px',
                marginBottom: '80px',
              }}
            >
              {/* Feature 1: Instant Insights */}
              <div
                style={{
                  borderRadius: '24px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  padding: '32px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  transform: 'scale(1)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.02) translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.15)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1) translateY(0px)'
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px',
                    boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <Zap style={{ width: '32px', height: '32px', color: 'white' }} />
                </div>
                <h3
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#111827',
                    marginBottom: '12px',
                  }}
                >
                  3-Second Deep Insights
                </h3>
                <p
                  style={{
                    fontSize: '16px',
                    color: '#6b7280',
                    lineHeight: '1.6',
                    margin: 0,
                  }}
                >
                  Point your camera and instantly discover nutrition facts, cultural origins, and smart ingredient suggestions. No waiting, no guessing.
                </p>
              </div>

              {/* Feature 2: Smart Analysis */}
              <div
                style={{
                  borderRadius: '24px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  padding: '32px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  transform: 'scale(1)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.02) translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.15)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1) translateY(0px)'
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px',
                    boxShadow: '0 8px 20px rgba(234, 88, 12, 0.3)',
                  }}
                >
                  <Heart style={{ width: '32px', height: '32px', color: 'white' }} />
                </div>
                <h3
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#111827',
                    marginBottom: '12px',
                  }}
                >
                  6 Smart Analysis Modes
                </h3>
                <p
                  style={{
                    fontSize: '16px',
                    color: '#6b7280',
                    lineHeight: '1.6',
                    margin: 0,
                  }}
                >
                  Health insights, fitness optimization, cultural context, chef tips, science breakdowns, and budget analysis. Everything you need to know about your food.
                </p>
              </div>

              {/* Feature 3: Premium Experience */}
              <div
                style={{
                  borderRadius: '24px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  padding: '32px',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                  transform: 'scale(1)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.02) translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.15)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1) translateY(0px)'
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.1)'
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '24px',
                    boxShadow: '0 8px 20px rgba(168, 85, 247, 0.3)',
                  }}
                >
                  <Trophy style={{ width: '32px', height: '32px', color: 'white' }} />
                </div>
                <h3
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#111827',
                    marginBottom: '12px',
                  }}
                >
                  Premium Experience
                </h3>
                <p
                  style={{
                    fontSize: '16px',
                    color: '#6b7280',
                    lineHeight: '1.6',
                    margin: 0,
                  }}
                >
                  Unlock unlimited meal storage, advanced insights, and be the first to experience new features. Your food journey, elevated.
                </p>
              </div>
            </div>

            {/* Premium CTA Section */}
            {!isPremium && (
              <div
                style={{
                  borderRadius: '32px',
                  background: 'linear-gradient(135deg, #10b981 0%, #ea580c 100%)',
                  padding: '48px',
                  textAlign: 'center',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 25px 50px rgba(16, 185, 129, 0.3)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `
                      radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                      radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)
                    `,
                    animation: 'float 6s ease-in-out infinite',
                  }}
                />
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      margin: '0 auto 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(12px)',
                    }}
                  >
                    <TrendingUp style={{ width: '40px', height: '40px', color: 'white' }} />
                  </div>
                  <h2 style={{ fontSize: '36px', fontWeight: 'bold', marginBottom: '16px' }}>
                    Be First to Experience New Features
                  </h2>
                  <p style={{ fontSize: '18px', opacity: 0.9, marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px auto' }}>
                    Join our premium community and get early access to cutting-edge food insights, unlimited storage, and priority support.
                  </p>
                  <Link
                    href="/upgrade"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      backdropFilter: 'blur(12px)',
                      padding: '16px 32px',
                      borderRadius: '16px',
                      fontSize: '18px',
                      fontWeight: '600',
                      color: 'white',
                      textDecoration: 'none',
                      transform: 'scale(1)',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)'
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1) translateY(0px)'
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    <Crown style={{ height: '24px', width: '24px' }} />
                    Upgrade to Premium
                  </Link>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate(-50%, 0);
          }
          40%, 43% {
            transform: translate(-50%, -30px);
          }
          70% {
            transform: translate(-50%, -15px);
          }
          90% {
            transform: translate(-50%, -4px);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  )
}