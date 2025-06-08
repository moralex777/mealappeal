'use client'

import { Camera, Crown } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { useAuth } from '@/contexts/AuthContext'

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

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #ff6b6b 0%, #feca57 25%, #48dbfb 50%, #ff9ff3 75%, #54a0ff 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated Background Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'radial-gradient(circle at 20% 50%, rgba(255, 107, 107, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(72, 219, 251, 0.3) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(255, 159, 243, 0.3) 0%, transparent 50%)',
          animation: 'float 6s ease-in-out infinite',
          zIndex: 1,
        }}
      />

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
                gap: '0.75rem',
                borderRadius: '0.75rem',
                border: '1px solid #34d399',
                background: '#10b981',
                padding: '1.5rem',
                color: 'white',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                animation: 'bounce 1s infinite',
              }}
            >
              <div style={{ fontSize: '2rem' }}>🎉</div>
              <div>
                <p style={{ fontWeight: 'bold', margin: 0 }}>Welcome to Premium!</p>
                <p style={{ fontSize: '0.875rem', opacity: 0.9, margin: 0 }}>
                  Enjoy unlimited features and advanced insights!
                </p>
              </div>
              <button
                onClick={() => setShowPaymentSuccess(false)}
                style={{
                  marginLeft: 'auto',
                  fontSize: '1.125rem',
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
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div
            style={{
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '1rem 2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '2rem',
            }}
          >
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <div
                style={{
                  height: '2.5rem',
                  width: '2.5rem',
                  background: 'linear-gradient(135deg, #22c55e 0%, #f97316 100%)',
                  borderRadius: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'scale(1)',
                  transition: 'transform 0.3s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <Camera style={{ height: '1.5rem', width: '1.5rem', color: 'white' }} />
              </div>
              <h1
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  background: 'linear-gradient(to right, #16a34a, #ea580c)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: 0,
                }}
              >
                MealAppeal
              </h1>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              {user ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <Link
                      href="/camera"
                      style={{
                        fontWeight: '500',
                        color: 'rgba(55, 65, 81, 0.8)',
                        textDecoration: 'none',
                        transition: 'color 0.2s',
                      }}
                    >
                      Camera
                    </Link>
                    <Link
                      href="/meals"
                      style={{
                        fontWeight: '500',
                        color: 'rgba(55, 65, 81, 0.8)',
                        textDecoration: 'none',
                        transition: 'color 0.2s',
                      }}
                    >
                      My Meals
                    </Link>
                    <Link
                      href="/community"
                      style={{
                        fontWeight: '500',
                        color: 'rgba(55, 65, 81, 0.8)',
                        textDecoration: 'none',
                        transition: 'color 0.2s',
                      }}
                    >
                      Community
                    </Link>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {profile?.subscription_tier !== 'premium' && (
                      <Link
                        href="/upgrade"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          background: 'linear-gradient(135deg, #22c55e 0%, #f97316 100%)',
                          padding: '0.5rem 1rem',
                          borderRadius: '9999px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: 'white',
                          textDecoration: 'none',
                          transform: 'scale(1)',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'scale(1.05)'
                          e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'scale(1)'
                          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                        <Crown style={{ height: '1rem', width: '1rem' }} />
                        <span>Upgrade</span>
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: 'rgba(55, 65, 81, 0.8)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'color 0.2s',
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Link
                    href="/login"
                    style={{
                      padding: '0.5rem 1rem',
                      fontWeight: '500',
                      color: 'rgba(55, 65, 81, 0.8)',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    style={{
                      background: 'linear-gradient(135deg, #22c55e 0%, #f97316 100%)',
                      padding: '0.5rem 1.5rem',
                      borderRadius: '0.75rem',
                      fontWeight: '500',
                      color: 'white',
                      textDecoration: 'none',
                      transform: 'scale(1)',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'scale(1.05)'
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main style={{ position: 'relative' }}>
          <div
            style={{
              maxWidth: '80rem',
              margin: '0 auto',
              padding: '5rem 1.5rem',
            }}
          >
            {/* Hero Section */}
            <div
              style={{
                maxWidth: '64rem',
                margin: '0 auto',
                textAlign: 'center',
                marginBottom: '2rem',
              }}
            >
              <div style={{ marginBottom: '2rem' }}>
                {user && profile ? (
                  <>
                    <h2
                      style={{
                        fontSize: '3rem',
                        fontWeight: 'bold',
                        color: '#111827',
                        lineHeight: '1.2',
                        margin: '0 0 1.5rem 0',
                      }}
                    >
                      Welcome back,
                      <span
                        style={{
                          display: 'block',
                          background: 'linear-gradient(135deg, #16a34a 0%, #ea580c 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        {profile.full_name?.split(' ')[0] || 'Friend'}! 👋
                      </span>
                    </h2>
                    <p
                      style={{
                        maxWidth: '32rem',
                        margin: '0 auto',
                        fontSize: '1.25rem',
                        lineHeight: '1.75',
                        color: 'rgba(55, 65, 81, 0.8)',
                      }}
                    >
                      Ready to discover what's in your next meal? You've captured{' '}
                      {profile.meal_count || 0} meals so far - let's make it one more! 🍽️✨
                    </p>
                  </>
                ) : (
                  <>
                    <h2
                      style={{
                        fontSize: '3.75rem',
                        fontWeight: 'bold',
                        color: '#111827',
                        lineHeight: '1.2',
                        margin: '0 0 1.5rem 0',
                      }}
                    >
                      Transform Every Meal Into Your
                      <span
                        style={{
                          display: 'block',
                          background: 'linear-gradient(135deg, #16a34a 0%, #ea580c 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        Personal Nutrition Coach
                      </span>
                    </h2>
                    <p
                      style={{
                        maxWidth: '32rem',
                        margin: '0 auto',
                        fontSize: '1.25rem',
                        lineHeight: '1.75',
                        color: 'rgba(55, 65, 81, 0.8)',
                      }}
                    >
                      Stop guessing what's in your food. Point, shoot, and discover the complete
                      story behind every meal – from calories and nutrients to cultural origins and
                      smart ingredient swaps.
                    </p>
                  </>
                )}
              </div>

              {/* CTA Buttons */}
              <div
                style={{
                  maxWidth: '32rem',
                  margin: '0 auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  alignItems: 'center',
                }}
              >
                <Link
                  href={user ? '/camera' : '/signup'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    background: 'linear-gradient(135deg, #16a34a 0%, #ea580c 100%)',
                    padding: '1rem 2rem',
                    borderRadius: '0.75rem',
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: 'white',
                    textDecoration: 'none',
                    transform: 'scale(1)',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.05)'
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <Camera style={{ height: '1.5rem', width: '1.5rem' }} />
                  {user ? 'Start Discovering' : 'Try Free for 14 Days'}
                </Link>

                {!user && (
                  <Link
                    href="/login"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.75rem',
                      border: '2px solid rgba(55, 65, 81, 0.3)',
                      background: 'rgba(255, 255, 255, 0.8)',
                      padding: '1rem 2rem',
                      borderRadius: '0.75rem',
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: 'rgba(55, 65, 81, 0.8)',
                      textDecoration: 'none',
                      transform: 'scale(1)',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'scale(1.05)'
                      e.currentTarget.style.background = 'rgba(249, 250, 251, 0.9)'
                      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)'
                      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    I Have an Account
                  </Link>
                )}
              </div>

              {/* Social Proof */}
              <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                <p style={{ marginBottom: '1rem', color: 'rgba(107, 114, 128, 0.8)' }}>
                  Trusted by health-conscious food lovers worldwide
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2rem',
                    fontSize: '0.875rem',
                    color: 'rgba(156, 163, 175, 0.8)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: '#fbbf24' }}>★★★★★</span>
                    <span>4.9 rating</span>
                  </span>
                  <span>•</span>
                  <span>10,000+ meals analyzed daily</span>
                  <span>•</span>
                  <span>Join thousands discovering food freedom</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        @keyframes bounce {
          0%,
          20%,
          53%,
          80%,
          100% {
            transform: translate(-50%, 0);
          }
          40%,
          43% {
            transform: translate(-50%, -30px);
          }
          70% {
            transform: translate(-50%, -15px);
          }
          90% {
            transform: translate(-50%, -4px);
          }
        }
      `}</style>
    </div>
  )
}
