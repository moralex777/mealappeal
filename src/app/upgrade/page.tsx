'use client'

import { loadStripe } from '@stripe/stripe-js'
import { ArrowRight, Check, Crown } from 'lucide-react'
import { useState } from 'react'

import { useAuth } from '@/contexts/AuthContext'
import { getSupabase } from '@/lib/supabase'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PlanFeature {
  text: string
  included: boolean
}

const MONTHLY_PRICE = 4.99
const YEARLY_PRICE = 49.99
const YEARLY_SAVINGS = Math.round(
  ((MONTHLY_PRICE * 12 - YEARLY_PRICE) / (MONTHLY_PRICE * 12)) * 100
)

const PLAN_FEATURES: PlanFeature[] = [
  { text: 'Unlimited meal storage', included: true },
  { text: 'Advanced nutrition insights', included: true },
  { text: 'Unlimited public sharing', included: true },
  { text: 'Smart meal recommendations', included: true },
  { text: 'Export nutrition data', included: true },
  { text: 'Priority support', included: true },
]

export default function UpgradePage() {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async (priceType: 'monthly' | 'yearly') => {
    try {
      setLoading(priceType)
      setError(null)

      if (!user) {
        window.location.href = '/login'
        return
      }

      // Create Stripe Checkout Session
      const supabase = await getSupabase()
      const {
        data: { sessionId },
        error: checkoutError,
      } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceType,
          userId: user.id,
          userEmail: user.email,
          returnUrl: `${window.location.origin}/dashboard`,
        },
      })

      if (checkoutError) {
        throw checkoutError
      }

      // Redirect to Stripe Checkout
      const stripe = await stripePromise
      if (!stripe) {
        throw new Error('Stripe failed to initialize')
      }

      const { error: stripeError } = await stripe.redirectToCheckout({ sessionId })
      if (stripeError) {
        throw stripeError
      }
    } catch (err) {
      console.error('Error starting subscription:', err)
      setError('😅 Oops! Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="from-brand-50 min-h-screen bg-gradient-to-br to-orange-50 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">🚀 Upgrade to Premium</h1>
          <p className="text-muted-foreground text-xl">
            Unlock the full potential of your food journey
          </p>
        </div>

        {/* Plans Grid */}
        <div className="mb-12 grid gap-8 md:grid-cols-2">
          {/* Monthly Plan */}
          <div className="rounded-xl border border-white/20 bg-white/80 p-6 shadow-lg backdrop-blur-sm">
            <div className="mb-6 text-center">
              <Crown className="text-brand-600 mx-auto mb-4 h-12 w-12" />
              <h2 className="mb-2 text-2xl font-bold">Monthly Premium</h2>
              <div className="text-brand-600 mb-2 text-3xl font-bold">
                ${MONTHLY_PRICE.toFixed(2)}
                <span className="text-muted-foreground text-base font-normal">/month</span>
              </div>
              <button
                onClick={() => handleSubscribe('monthly')}
                disabled={loading === 'monthly'}
                className="from-brand-600 w-full transform rounded-lg bg-gradient-to-r to-orange-600 px-6 py-3 font-semibold text-white transition-all hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading === 'monthly' ? (
                  <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                ) : (
                  <>
                    Start Monthly Plan <ArrowRight className="ml-2 inline h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            <div className="space-y-4">
              {PLAN_FEATURES.map((feature, index) => (
                <div key={index} className="flex items-center text-sm">
                  <Check className="mr-3 h-5 w-5 flex-shrink-0 text-green-500" />
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Yearly Plan */}
          <div className="relative transform rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white shadow-lg transition-all hover:scale-[1.02]">
            <div className="absolute -top-2 -right-2 rounded-full bg-green-500 px-2 py-1 text-xs text-white">
              Save {YEARLY_SAVINGS}%
            </div>

            <div className="mb-6 text-center">
              <Crown className="mx-auto mb-4 h-12 w-12 text-white" />
              <h2 className="mb-2 text-2xl font-bold">Yearly Premium</h2>
              <div className="mb-2 text-3xl font-bold">
                ${YEARLY_PRICE.toFixed(2)}
                <span className="text-base font-normal opacity-90">/year</span>
              </div>
              <button
                onClick={() => handleSubscribe('yearly')}
                disabled={loading === 'yearly'}
                className="w-full transform rounded-lg bg-white px-6 py-3 font-semibold text-purple-600 transition-all hover:scale-105 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading === 'yearly' ? (
                  <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-purple-600 border-t-transparent"></div>
                ) : (
                  <>
                    Start Yearly Plan <ArrowRight className="ml-2 inline h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            <div className="space-y-4">
              {PLAN_FEATURES.map((feature, index) => (
                <div key={index} className="flex items-center text-sm">
                  <Check className="mr-3 h-5 w-5 flex-shrink-0 text-white" />
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && <div className="mb-8 text-center text-red-600">{error}</div>}

        {/* Security Notice */}
        <div className="text-muted-foreground text-center text-sm">
          Cancel anytime. Start or pause your subscription whenever you need.
        </div>
      </div>
    </div>
  )
}
