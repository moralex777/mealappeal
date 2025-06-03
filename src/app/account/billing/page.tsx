'use client'

import { AlertCircle, ArrowLeft, CheckCircle, CreditCard, Crown, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useAuth } from '@/contexts/AuthContext'
import { getSupabase } from '@/lib/supabase'

interface ISubscriptionDetails {
  subscription_tier: 'free' | 'premium'
  subscription_expires_at?: string
  stripe_customer_id?: string
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
  const { user } = useAuth()
  const router = useRouter()
  const [subscription, setSubscription] = useState<ISubscriptionDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    loadSubscriptionDetails()
  }, [user, router])

  const loadSubscriptionDetails = async () => {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_tier, subscription_expires_at, stripe_customer_id')
        .eq('id', user!.id)
        .single()

      if (error) {
        throw error
      }
      setSubscription(data)
    } catch (err) {
      console.error('Error loading subscription:', err)
      setError('Failed to load subscription details')
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
    try {
      const supabase = await getSupabase()
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
        throw new Error('Failed to create billing portal session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (err) {
      console.error('Error opening billing portal:', err)
      setError('Failed to open billing portal')
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

  if (loading) {
    return (
      <div className="from-brand-50 min-h-screen bg-gradient-to-br to-orange-50 p-4">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl bg-white p-8 shadow-lg">
            <div className="animate-pulse">
              <div className="mb-6 h-8 rounded bg-gray-200"></div>
              <div className="mb-6 h-32 rounded bg-gray-200"></div>
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="h-24 rounded bg-gray-200"></div>
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
      <div className="from-brand-50 flex min-h-screen items-center justify-center bg-gradient-to-br to-orange-50 p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <div className="mb-4 text-red-500">⚠️</div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">Error Loading Billing</h2>
          <p className="mb-4 text-gray-600">{error}</p>
          <button onClick={() => router.push('/account')} className="btn-primary">
            Return to Account
          </button>
        </div>
      </div>
    )
  }

  const isPremium = subscription?.subscription_tier === 'premium'

  return (
    <div className="from-brand-50 min-h-screen bg-gradient-to-br to-orange-50 p-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center">
          <button
            onClick={() => router.push('/account')}
            className="mr-4 rounded-full p-2 transition-colors hover:bg-white/50"
            aria-label="Go back to account page"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Billing & Subscription</h1>
            <p className="text-gray-600">Manage your MealAppeal subscription 💳</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-center space-x-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Current Subscription Status */}
        <div className="mb-8 overflow-hidden rounded-2xl bg-white shadow-lg">
          <div
            className={`p-6 ${isPremium ? 'from-brand-500 bg-gradient-to-r to-orange-500' : 'bg-gradient-to-r from-gray-400 to-gray-500'}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
                  {isPremium ? (
                    <Crown className="h-6 w-6 text-white" />
                  ) : (
                    <CreditCard className="h-6 w-6 text-white" />
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {isPremium ? 'Premium Subscription' : 'Free Plan'}
                  </h2>
                  <p className="text-white/80">
                    {isPremium ? 'Active premium membership' : 'Limited features available'}
                  </p>
                </div>
              </div>
              {isPremium && (
                <div className="text-right">
                  <div className="text-sm text-white/80">Next billing</div>
                  <div className="font-semibold text-white">
                    {subscription?.subscription_expires_at
                      ? formatExpiryDate(subscription.subscription_expires_at)
                      : 'Unknown'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Plan Details */}
          <div className="p-6">
            {isPremium ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-green-600">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Features</span>
                  <span className="font-medium text-gray-900">All Premium Features</span>
                </div>
                <div className="border-t border-gray-100 pt-4">
                  <button
                    onClick={handleManageBilling}
                    disabled={actionLoading}
                    className="bg-brand-500 hover:bg-brand-600 w-full rounded-xl px-6 py-3 font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionLoading ? 'Opening...' : 'Manage Billing & Payment'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="mb-4 text-gray-600">
                  You&apos;re currently on the free plan with limited features.
                </p>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
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

        {/* Upgrade Plans (for free users) or Plan Options (for premium users) */}
        {!isPremium ? (
          <div className="space-y-6">
            <div className="mb-8 text-center">
              <h2 className="mb-2 text-2xl font-bold text-gray-900">Upgrade to Premium 🚀</h2>
              <p className="text-gray-600">
                Unlock all features and get the most out of MealAppeal
              </p>
            </div>

            <div className="grid gap-6">
              {pricingPlans.map(plan => (
                <div
                  key={plan.id}
                  className="hover:border-brand-200 overflow-hidden rounded-2xl border-2 border-transparent bg-white shadow-lg transition-all duration-200"
                >
                  <div className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                        {plan.savings && (
                          <span className="mt-1 inline-block rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                            {plan.savings}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-brand-600 text-3xl font-bold">${plan.price}</div>
                        <div className="text-sm text-gray-500">per {plan.period}</div>
                        {plan.originalPrice && (
                          <div className="text-sm text-gray-400 line-through">
                            ${plan.originalPrice}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-6 space-y-2">
                      {plan.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-500" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleUpgrade(plan.id)}
                      className="from-brand-500 hover:from-brand-600 w-full transform rounded-xl bg-gradient-to-r to-orange-500 px-6 py-3 font-semibold text-white transition-all duration-200 hover:scale-105 hover:to-orange-600"
                    >
                      Upgrade to {plan.name}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Money-back guarantee */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
              <div className="mb-2 flex items-center justify-center space-x-2">
                <Star className="h-5 w-5 text-blue-500" />
                <span className="font-semibold text-blue-900">30-Day Money-Back Guarantee</span>
              </div>
              <p className="text-sm text-blue-700">
                Not satisfied? Get a full refund within 30 days, no questions asked.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Need Help?</h3>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Questions about your subscription? Contact our support team at{' '}
                <a
                  href="mailto:support@mealappeal.com"
                  className="text-brand-600 hover:text-brand-700 font-medium"
                >
                  support@mealappeal.com
                </a>
              </p>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Cancel anytime through billing portal</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
