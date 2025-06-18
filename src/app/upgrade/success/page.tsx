'use client'

import { CheckCircle, Sparkles, ArrowRight, Loader2, Crown, TrendingUp, Calendar, Zap } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { AppLayout } from '@/components/AppLayout'
import { useAuth } from '@/contexts/AuthContext'

export default function UpgradeSuccessPage(): React.ReactNode {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, profile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showUpsell, setShowUpsell] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState(10) // 10 seconds for monthly, instant for yearly

  const sessionId = searchParams.get('session_id')
  const isMock = searchParams.get('mock') === 'true'
  const planType = searchParams.get('plan') || 'monthly'
  const isYearly = planType === 'yearly'

  useEffect(() => {
    const verifySubscription = async () => {
      try {
        // For mock mode, just simulate success
        if (isMock) {
          console.log('🎭 Mock mode - simulating success')
          setLoading(false)
          // Show upsell for monthly subscribers
          if (!isYearly) {
            setTimeout(() => setShowUpsell(true), 2000)
          }
          return
        }

        // If we have a session ID, verify the payment
        if (sessionId) {
          console.log('🔍 Verifying subscription with session:', sessionId)
          
          // Give webhook time to process
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          // Refresh profile to get updated subscription status
          if (refreshProfile) {
            await refreshProfile()
          }
          
          setLoading(false)
          
          // Show upsell for monthly subscribers after a delay
          if (!isYearly) {
            setTimeout(() => setShowUpsell(true), 3000)
          }
        } else {
          setError('No payment session found')
          setLoading(false)
        }
      } catch (err) {
        console.error('Error verifying subscription:', err)
        setError('Failed to verify subscription')
        setLoading(false)
      }
    }

    verifySubscription()
  }, [sessionId, isMock, refreshProfile, isYearly])

  // Countdown timer for redirect (monthly users see this)
  useEffect(() => {
    if (!loading && !error && !isYearly && redirectCountdown > 0) {
      const timer = setInterval(() => {
        setRedirectCountdown(prev => prev - 1)
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [loading, error, isYearly, redirectCountdown])

  // Auto-redirect when countdown reaches 0
  useEffect(() => {
    if (redirectCountdown === 0) {
      router.push('/meals')
    }
  }, [redirectCountdown, router])

  const handleUpgradeToYearly = async () => {
    // Redirect to upgrade page with special yearly upgrade parameter
    router.push('/upgrade?offer=yearly-upgrade&from=monthly')
  }

  return (
    <AppLayout>
      <div
        style={{
          minHeight: '100vh',
          background: isYearly 
            ? 'linear-gradient(135deg, #fef3c7 0%, #f3e8ff 25%, #fce7f3 50%, #dbeafe 75%, #d1fae5 100%)'
            : 'linear-gradient(135deg, #f0fdf4 0%, #f3e8ff 50%, #fce7f3 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: '700px',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '24px',
            padding: '48px',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(12px)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Confetti effect for yearly subscribers */}
          {isYearly && !loading && !error && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100px', overflow: 'hidden', pointerEvents: 'none' }}>
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    left: `${Math.random() * 100}%`,
                    width: '10px',
                    height: '10px',
                    background: ['#10b981', '#ea580c', '#f59e0b', '#3b82f6'][Math.floor(Math.random() * 4)],
                    borderRadius: '50%',
                    animation: `fall ${3 + Math.random() * 2}s linear infinite`,
                    animationDelay: `${Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>
          )}

          {loading ? (
            <>
              <Loader2
                style={{
                  width: '64px',
                  height: '64px',
                  color: '#10b981',
                  margin: '0 auto 32px',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>
                Activating Your Premium Account...
              </h1>
              <p style={{ fontSize: '18px', color: '#6b7280' }}>
                Please wait while we process your {planType} subscription
              </p>
            </>
          ) : error ? (
            <>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  background: '#fef2f2',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 32px',
                }}
              >
                <span style={{ fontSize: '48px' }}>⚠️</span>
              </div>
              <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#dc2626', marginBottom: '16px' }}>
                Something Went Wrong
              </h1>
              <p style={{ fontSize: '18px', color: '#6b7280', marginBottom: '32px' }}>
                {error}
              </p>
              <Link href="/upgrade">
                <button
                  style={{
                    padding: '16px 32px',
                    borderRadius: '12px',
                    background: 'linear-gradient(to right, #10b981, #ea580c)',
                    color: 'white',
                    border: 'none',
                    fontSize: '18px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                  Try Again
                </button>
              </Link>
            </>
          ) : (
            <>
              {/* Success Animation */}
              <div
                style={{
                  width: '100px',
                  height: '100px',
                  background: isYearly 
                    ? 'linear-gradient(45deg, #fbbf24, #f59e0b)'
                    : 'linear-gradient(to right, #10b981, #ea580c)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 32px',
                  animation: 'pulse 2s infinite',
                  boxShadow: isYearly 
                    ? '0 8px 15px rgba(251, 191, 36, 0.4)'
                    : '0 8px 15px rgba(16, 185, 129, 0.3)',
                }}
              >
                {isYearly ? (
                  <Crown style={{ width: '60px', height: '60px', color: 'white' }} />
                ) : (
                  <CheckCircle style={{ width: '60px', height: '60px', color: 'white' }} />
                )}
              </div>

              {/* Different messages for monthly vs yearly */}
              {isYearly ? (
                <>
                  <h1
                    style={{
                      fontSize: '48px',
                      fontWeight: 'bold',
                      marginBottom: '24px',
                      background: 'linear-gradient(45deg, #fbbf24, #f59e0b)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    You're a VIP Member! 👑
                  </h1>

                  <p style={{ fontSize: '24px', color: '#1f2937', marginBottom: '16px', fontWeight: '600' }}>
                    Welcome to the Elite Circle!
                  </p>

                  <p style={{ fontSize: '20px', color: '#6b7280', marginBottom: '40px', lineHeight: '1.6' }}>
                    You've made the smartest choice! Enjoy <strong>$9.89 in savings</strong> and all premium features for a full year.
                  </p>

                  {/* VIP Benefits */}
                  <div
                    style={{
                      background: 'linear-gradient(to right, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.1))',
                      borderRadius: '16px',
                      padding: '24px',
                      marginBottom: '40px',
                      border: '2px solid rgba(251, 191, 36, 0.3)',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '22px',
                        fontWeight: '700',
                        color: '#92400e',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                    >
                      <Sparkles style={{ width: '28px', height: '28px', color: '#f59e0b' }} />
                      Your VIP Benefits
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', textAlign: 'left' }}>
                      {[
                        { icon: '♾️', text: 'Unlimited everything, forever' },
                        { icon: '🚀', text: 'Priority processing & support' },
                        { icon: '🧬', text: 'USDA scientific database access' },
                        { icon: '📊', text: 'Advanced analytics & insights' },
                        { icon: '💎', text: 'VIP member badge' },
                        { icon: '🎁', text: 'Early access to new features' },
                      ].map((benefit, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '24px' }}>{benefit.icon}</span>
                          <span style={{ color: '#92400e', fontSize: '16px', fontWeight: '500' }}>{benefit.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h1
                    style={{
                      fontSize: '40px',
                      fontWeight: 'bold',
                      marginBottom: '24px',
                      background: 'linear-gradient(to right, #10b981, #ea580c)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Welcome to Premium! 🎉
                  </h1>

                  <p style={{ fontSize: '20px', color: '#6b7280', marginBottom: '40px', lineHeight: '1.6' }}>
                    Your monthly subscription is now active!<br />
                    You have access to all premium features.
                  </p>

                  {/* Monthly Benefits */}
                  <div
                    style={{
                      background: 'linear-gradient(to right, rgba(16, 185, 129, 0.1), rgba(234, 88, 12, 0.1))',
                      borderRadius: '16px',
                      padding: '24px',
                      marginBottom: showUpsell ? '24px' : '40px',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        color: '#1f2937',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                    >
                      <Sparkles style={{ width: '24px', height: '24px', color: '#10b981' }} />
                      Your Premium Benefits
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left' }}>
                      {[
                        'Unlimited meal analyses per day',
                        'USDA scientific nutrition database',
                        'Advanced AI nutrition insights',
                        'Detailed macro & micronutrients',
                        'Meal history never expires',
                        'Priority customer support',
                      ].map((benefit, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <CheckCircle style={{ width: '20px', height: '20px', color: '#10b981', flexShrink: 0 }} />
                          <span style={{ color: '#1f2937', fontSize: '16px' }}>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Upsell for monthly subscribers */}
                  {showUpsell && (
                    <div
                      style={{
                        background: 'linear-gradient(45deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.15))',
                        borderRadius: '16px',
                        padding: '24px',
                        marginBottom: '32px',
                        border: '2px solid rgba(251, 191, 36, 0.4)',
                        animation: 'slideIn 0.5s ease-out',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                        <TrendingUp style={{ width: '24px', height: '24px', color: '#f59e0b' }} />
                        <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#92400e' }}>
                          Wait! One Last Offer 🎁
                        </h3>
                      </div>
                      <p style={{ fontSize: '18px', color: '#92400e', marginBottom: '16px', fontWeight: '600' }}>
                        Upgrade to Yearly now and save $9.89!
                      </p>
                      <p style={{ fontSize: '16px', color: '#b45309', marginBottom: '20px' }}>
                        Switch to yearly billing right now and pay only $49.99/year instead of $59.88/year. That's 2 months FREE!
                      </p>
                      <button
                        onClick={handleUpgradeToYearly}
                        style={{
                          width: '100%',
                          padding: '16px',
                          borderRadius: '12px',
                          background: 'linear-gradient(45deg, #fbbf24, #f59e0b)',
                          color: 'white',
                          border: 'none',
                          fontSize: '18px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 8px 15px rgba(245, 158, 11, 0.3)',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'scale(1.02)'
                          e.currentTarget.style.boxShadow = '0 12px 20px rgba(245, 158, 11, 0.4)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'scale(1)'
                          e.currentTarget.style.boxShadow = '0 8px 15px rgba(245, 158, 11, 0.3)'
                        }}
                      >
                        🚀 Upgrade to Yearly & Save $9.89
                      </button>
                      <p style={{ fontSize: '14px', color: '#92400e', marginTop: '12px', opacity: 0.8 }}>
                        Limited time offer • No additional payment today
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* CTA Buttons */}
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/meals">
                  <button
                    style={{
                      padding: '16px 32px',
                      borderRadius: '12px',
                      background: isYearly 
                        ? 'linear-gradient(45deg, #fbbf24, #f59e0b)'
                        : 'linear-gradient(to right, #10b981, #ea580c)',
                      color: 'white',
                      border: 'none',
                      fontSize: '18px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.3s ease',
                      boxShadow: isYearly 
                        ? '0 8px 15px rgba(251, 191, 36, 0.4)'
                        : '0 8px 15px rgba(16, 185, 129, 0.3)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'scale(1.05)'
                      e.currentTarget.style.boxShadow = isYearly 
                        ? '0 12px 20px rgba(251, 191, 36, 0.5)'
                        : '0 12px 20px rgba(16, 185, 129, 0.4)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.boxShadow = isYearly 
                        ? '0 8px 15px rgba(251, 191, 36, 0.4)'
                        : '0 8px 15px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    {isYearly ? '🍽️ Start Your VIP Journey' : 'Start Analyzing Meals'}
                    <ArrowRight style={{ width: '20px', height: '20px' }} />
                  </button>
                </Link>
                
                <Link href="/account">
                  <button
                    style={{
                      padding: '16px 32px',
                      borderRadius: '12px',
                      background: 'white',
                      color: '#1f2937',
                      border: '2px solid #e5e7eb',
                      fontSize: '18px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = isYearly ? '#f59e0b' : '#10b981'
                      e.currentTarget.style.color = isYearly ? '#f59e0b' : '#10b981'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = '#e5e7eb'
                      e.currentTarget.style.color = '#1f2937'
                    }}
                  >
                    View Account
                  </button>
                </Link>
              </div>

              {/* Redirect timer for monthly users */}
              {!isYearly && (
                <p style={{ fontSize: '14px', color: '#9ca3af', marginTop: '32px' }}>
                  Redirecting to your meals in {redirectCountdown} seconds...
                </p>
              )}

              {/* Instant gratification message for yearly */}
              {isYearly && (
                <div style={{ marginTop: '32px', padding: '16px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '12px' }}>
                  <p style={{ fontSize: '16px', color: '#92400e', fontWeight: '600' }}>
                    🎊 You saved $9.89 by choosing yearly!
                  </p>
                  <p style={{ fontSize: '14px', color: '#b45309', marginTop: '4px' }}>
                    That's like getting 2 months completely FREE
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fall {
          to {
            transform: translateY(110vh);
          }
        }
      `}</style>
    </AppLayout>
  )
}