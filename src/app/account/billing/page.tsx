'use client'

import { AlertCircle, ArrowLeft, Camera, CheckCircle, CreditCard, Crown, Star } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface ISubscriptionDetails {
  subscription_tier: 'free' | 'premium_monthly' | 'premium_yearly'
  subscription_expires_at?: string
  stripe_customer_id?: string
  billing_cycle: 'free' | 'monthly' | 'yearly' | null
}

interface IPricingPlan {
  id: 'monthly' | 'yearly'
  name: string
  price: number
  originalPrice?: number
  period: string
  savings?: string
  features: string[]
}

const pricingPlans: IPricingPlan[] = [
  {
    id: 'monthly',
    name: 'Premium Monthly',
    price: 4.99,
    period: 'month',
    features: [
      'Unlimited meal storage',
      'Advanced nutrition analysis',
      'Unlimited social shares',
      '6 analysis modes',
      'Export meal data',
      'Priority support',
    ],
  },
  {
    id: 'yearly',
    name: 'Premium Yearly',
    price: 49.99,
    originalPrice: 59.88,
    period: 'year',
    savings: 'Save 17%',
    features: [
      'All monthly features',
      'Annual subscription discount',
      'Exclusive beta features',
      'Extended data history',
      'Advanced analytics',
      'Personal nutrition coach',
    ],
  },
]

export default function BillingPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [subscription, setSubscription] = useState<ISubscriptionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) {
      return
    }

    if (!user) {
      router.push('/login')
      return
    }

    loadSubscriptionDetails()
  }, [user, authLoading, router])

  const loadSubscriptionDetails = async () => {
    if (!user?.id) {
      setError('User not authenticated')
      setLoading(false)
      return
    }

    try {
      setError(null)
      console.log('🔍 Loading subscription for user:', user.id)
      
      // Check if Supabase is properly configured
      if (!process.env['NEXT_PUBLIC_SUPABASE_URL']) {
        console.warn('⚠️ Supabase not configured, using default subscription data')
        setSubscription({
          subscription_tier: 'free',
          billing_cycle: 'free',
          subscription_expires_at: undefined,
          stripe_customer_id: undefined
        })
        setLoading(false)
        return
      }
      
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_expires_at, stripe_customer_id, billing_cycle')
        .eq('id', user.id)
        .single()

      console.log('📊 Subscription query result:', { data, error: queryError })

      if (queryError) {
        if (queryError.code === 'PGRST116') {
          // No profile found - create default one
          console.log('👤 No profile found, creating default profile...')
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              user_id: user.id,
              full_name: user.user_metadata?.['full_name'] || null,
              subscription_tier: 'free',
              billing_cycle: 'free',
              meal_count: 0,
              monthly_shares_used: 0,
            })
            .select('subscription_tier, subscription_expires_at, stripe_customer_id, billing_cycle')
            .single()

          if (createError) {
            console.error('❌ Error creating profile:', createError)
            throw createError
          }

          console.log('✅ Created new profile:', newProfile)
          setSubscription(newProfile)
        } else {
          throw queryError
        }
      } else if (data) {
        console.log('✅ Subscription data loaded:', data)
        setSubscription(data)
      } else {
        console.log('⚠️ No data returned from query')
        setError('No subscription data found')
      }
    } catch (err: any) {
      console.error('❌ Error loading subscription:', err)
      setError(err.message || 'Failed to load subscription details')
    } finally {
      setLoading(false)
    }
  }

  const handleManageBilling = async () => {
    if (!subscription?.stripe_customer_id) {
      setError('No billing information found')
      return
    }

    setActionLoading(true)
    setError(null)
    
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        throw new Error('No valid session found')
      }

      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to create billing portal session')
      }

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      } else {
        throw new Error('No portal URL received')
      }
    } catch (err: any) {
      console.error('Error opening billing portal:', err)
      setError(err.message || 'Failed to open billing portal')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpgrade = (planId: string) => {
    router.push(`/upgrade?plan=${planId}`)
  }

  const formatExpiryDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

  if (loading || authLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background:
            'linear-gradient(135deg, #f9fafb 0%, #f3e8ff 25%, #fce7f3 50%, #fff7ed 75%, #f0fdf4 100%)',
          padding: '24px',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div
            style={{
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
              padding: '48px',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div style={{ animation: 'pulse 2s infinite' }}>
              <div
                style={{
                  height: '32px',
                  borderRadius: '12px',
                  background: 'linear-gradient(to right, #e5e7eb, #d1d5db)',
                  marginBottom: '32px',
                  animation: 'pulse 2s infinite',
                }}
              />
              <div
                style={{
                  height: '128px',
                  borderRadius: '16px',
                  background: 'linear-gradient(to right, #e5e7eb, #d1d5db)',
                  marginBottom: '32px',
                  animation: 'pulse 2s infinite',
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[1, 2].map(i => (
                  <div
                    key={i}
                    style={{
                      height: '96px',
                      borderRadius: '12px',
                      background: 'linear-gradient(to right, #e5e7eb, #d1d5db)',
                      animation: 'pulse 2s infinite',
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !subscription) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background:
            'linear-gradient(135deg, #f9fafb 0%, #f3e8ff 25%, #fce7f3 50%, #fff7ed 75%, #f0fdf4 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            maxWidth: '400px',
            borderRadius: '24px',
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
            padding: '48px',
            backdropFilter: 'blur(12px)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '24px' }}>⚠️</div>
          <h2
            style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '12px' }}
          >
            Error Loading Billing
          </h2>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>{error}</p>
          <button
            onClick={() => router.push('/account')}
            style={{
              background: 'linear-gradient(to right, #10b981, #ea580c)',
              color: 'white',
              padding: '16px 32px',
              borderRadius: '16px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 8px 15px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.05)'
              e.currentTarget.style.boxShadow = '0 12px 20px rgba(16, 185, 129, 0.4)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 8px 15px rgba(16, 185, 129, 0.3)'
            }}
          >
            Return to Account
          </button>
        </div>
      </div>
    )
  }

  const isPremium =
    subscription?.subscription_tier === 'premium_monthly' ||
    subscription?.subscription_tier === 'premium_yearly'
  const currentPlan = subscription?.billing_cycle === 'yearly' ? 'yearly' : 'monthly'

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(135deg, #f9fafb 0%, #f3e8ff 25%, #fce7f3 50%, #fff7ed 75%, #f0fdf4 100%)',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                textDecoration: 'none',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  background: 'linear-gradient(to right, #10b981, #ea580c)',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 15px rgba(16, 185, 129, 0.3)',
                  transition: 'transform 0.3s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <Camera style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
              <h1
                style={{
                  background: 'linear-gradient(to right, #10b981, #ea580c)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  margin: 0,
                }}
              >
                MealAppeal
              </h1>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '48px 24px' }}>
        {/* Page Title with Back Button */}
        <div style={{ marginBottom: '48px', display: 'flex', alignItems: 'center' }}>
          <button
            onClick={() => router.push('/account')}
            style={{
              marginRight: '16px',
              padding: '12px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.8)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'white'
              e.currentTarget.style.transform = 'scale(1.1)'
              e.currentTarget.style.boxShadow = '0 8px 15px rgba(0, 0, 0, 0.1)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)'
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}
            aria-label="Go back to account page"
          >
            <ArrowLeft style={{ width: '24px', height: '24px', color: '#6b7280' }} />
          </button>
          <div>
            <h1
              style={{
                fontSize: '40px',
                fontWeight: 'bold',
                background: 'linear-gradient(to right, #10b981, #ea580c)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0,
              }}
            >
              Billing & Subscription
            </h1>
            <p style={{ fontSize: '18px', color: '#6b7280', margin: 0 }}>
              Manage your MealAppeal subscription 💳
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px',
              padding: '16px',
              borderRadius: '16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '2px solid #ef4444',
            }}
          >
            <AlertCircle
              style={{ width: '24px', height: '24px', color: '#ef4444', flexShrink: 0 }}
            />
            <p style={{ color: '#dc2626', fontSize: '16px', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Current Subscription Status Card */}
        <div
          style={{
            borderRadius: '24px',
            background: 'rgba(255, 255, 255, 0.95)',
            boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden',
            backdropFilter: 'blur(12px)',
            marginBottom: '32px',
          }}
        >
          <div
            style={{
              padding: '32px',
              background: isPremium
                ? 'linear-gradient(to right, #10b981, #ea580c)'
                : 'linear-gradient(to right, #6b7280, #4b5563)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  {isPremium ? (
                    <Crown style={{ width: '32px', height: '32px', color: 'white' }} />
                  ) : (
                    <CreditCard style={{ width: '32px', height: '32px', color: 'white' }} />
                  )}
                </div>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', margin: 0 }}>
                    {isPremium ? 'Premium Subscription' : 'Free Plan'}
                  </h2>
                  <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
                    {isPremium ? 'Active premium membership' : 'Limited features available'}
                  </p>
                </div>
              </div>
              {isPremium && subscription?.subscription_expires_at && (
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)' }}>
                    Next billing
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: 'white' }}>
                    {formatExpiryDate(subscription.subscription_expires_at)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Plan Details */}
          <div style={{ padding: '32px', background: 'white' }}>
            {isPremium ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span style={{ color: '#6b7280', fontSize: '16px' }}>Status</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle style={{ width: '20px', height: '20px', color: '#10b981' }} />
                    <span style={{ fontWeight: '600', color: '#059669', fontSize: '16px' }}>
                      Active
                    </span>
                  </div>
                </div>
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span style={{ color: '#6b7280', fontSize: '16px' }}>Current Plan</span>
                  <span style={{ fontWeight: '600', color: '#1f2937', fontSize: '16px' }}>
                    Premium {currentPlan === 'yearly' ? 'Yearly' : 'Monthly'}
                  </span>
                </div>
                <div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span style={{ color: '#6b7280', fontSize: '16px' }}>Features</span>
                  <span style={{ fontWeight: '600', color: '#1f2937', fontSize: '16px' }}>
                    All Premium Features
                  </span>
                </div>
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
                  <button
                    onClick={handleManageBilling}
                    disabled={actionLoading}
                    style={{
                      width: '100%',
                      padding: '18px',
                      borderRadius: '16px',
                      border: 'none',
                      background: 'linear-gradient(to right, #10b981, #ea580c)',
                      color: 'white',
                      fontSize: '18px',
                      fontWeight: '600',
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                      opacity: actionLoading ? 0.7 : 1,
                      transition: 'all 0.3s ease',
                      boxShadow: '0 8px 15px rgba(16, 185, 129, 0.3)',
                    }}
                    onMouseEnter={e => {
                      if (!actionLoading) {
                        e.currentTarget.style.transform = 'scale(1.02)'
                        e.currentTarget.style.boxShadow = '0 12px 20px rgba(16, 185, 129, 0.4)'
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.boxShadow = '0 8px 15px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    {actionLoading ? 'Opening...' : 'Manage Billing & Payment'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '16px' }}>
                  You&apos;re currently on the free plan with limited features.
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                    fontSize: '14px',
                    color: '#6b7280',
                  }}
                >
                  <span>✓ 14-day meal storage</span>
                  <span>•</span>
                  <span>✓ 3 monthly shares</span>
                  <span>•</span>
                  <span>✓ Basic nutrition</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upgrade Plans for Free Users */}
        {!isPremium && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <h2
                style={{
                  fontSize: '36px',
                  fontWeight: 'bold',
                  marginBottom: '12px',
                  background: 'linear-gradient(to right, #10b981, #ea580c)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Upgrade to Premium 🚀
              </h2>
              <p style={{ fontSize: '18px', color: '#6b7280' }}>
                Unlock all features and get the most out of MealAppeal
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {pricingPlans.map(plan => (
                <div
                  key={plan.id}
                  style={{
                    borderRadius: '24px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
                    padding: '32px',
                    backdropFilter: 'blur(12px)',
                    border: '2px solid transparent',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#10b981'
                    e.currentTarget.style.transform = 'scale(1.02)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'transparent'
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  {plan.savings && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'linear-gradient(to right, #10b981, #34d399)',
                        padding: '6px 16px',
                        borderRadius: '24px',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '600',
                      }}
                    >
                      {plan.savings}
                    </div>
                  )}

                  <div style={{ marginBottom: '24px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <h3
                        style={{
                          fontSize: '24px',
                          fontWeight: 'bold',
                          color: '#1f2937',
                          margin: 0,
                        }}
                      >
                        {plan.name}
                      </h3>
                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontSize: '36px',
                            fontWeight: 'bold',
                            background: 'linear-gradient(to right, #10b981, #ea580c)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }}
                        >
                          ${plan.price}
                        </div>
                        <div style={{ fontSize: '14px', color: '#6b7280' }}>per {plan.period}</div>
                        {plan.originalPrice && (
                          <div
                            style={{
                              fontSize: '14px',
                              color: '#9ca3af',
                              textDecoration: 'line-through',
                            }}
                          >
                            ${plan.originalPrice}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginBottom: '32px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    {plan.features.map((feature, index) => (
                      <div
                        key={index}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                      >
                        <CheckCircle
                          style={{ width: '20px', height: '20px', color: '#10b981', flexShrink: 0 }}
                        />
                        <span style={{ fontSize: '16px', color: '#4b5563' }}>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    style={{
                      width: '100%',
                      padding: '18px',
                      borderRadius: '16px',
                      border: 'none',
                      background: 'linear-gradient(to right, #10b981, #ea580c)',
                      color: 'white',
                      fontSize: '18px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 8px 15px rgba(16, 185, 129, 0.3)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'scale(1.05)'
                      e.currentTarget.style.boxShadow = '0 12px 20px rgba(16, 185, 129, 0.4)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.boxShadow = '0 8px 15px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    Upgrade to {plan.name}
                  </button>
                </div>
              ))}
            </div>

            {/* Money-back guarantee */}
            <div
              style={{
                marginTop: '48px',
                borderRadius: '16px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '2px solid #3b82f6',
                padding: '24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                }}
              >
                <Star style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
                <span style={{ fontSize: '18px', fontWeight: '600', color: '#1e40af' }}>
                  30-Day Money-Back Guarantee
                </span>
              </div>
              <p style={{ fontSize: '16px', color: '#2563eb', margin: 0 }}>
                Not satisfied? Get a full refund within 30 days, no questions asked.
              </p>
            </div>
          </div>
        )}

        {/* Help Section for Premium Users */}
        {isPremium && (
          <div
            style={{
              borderRadius: '24px',
              background: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
              padding: '32px',
              backdropFilter: 'blur(12px)',
            }}
          >
            <h3
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: '16px',
              }}
            >
              Need Help?
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '16px', color: '#6b7280' }}>
                Questions about your subscription? Contact our support team at{' '}
                <a
                  href="mailto:support@mealappeal.com"
                  style={{
                    color: '#10b981',
                    fontWeight: '600',
                    textDecoration: 'none',
                    transition: 'color 0.3s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#ea580c'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = '#10b981'
                  }}
                >
                  support@mealappeal.com
                </a>
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle style={{ width: '20px', height: '20px', color: '#10b981' }} />
                <span style={{ fontSize: '14px', color: '#6b7280' }}>
                  Cancel anytime through billing portal
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  )
}
