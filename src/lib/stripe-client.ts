// Enhanced Stripe Client with Context7-powered latest patterns
// Implements modern Stripe subscription handling for MealAppeal

import { loadStripe, type Stripe, type StripeError } from '@stripe/stripe-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Singleton pattern for Stripe instance
let stripePromise: Promise<Stripe | null>

export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

    if (!publishableKey) {
      console.error('Missing Stripe publishable key')
      return Promise.resolve(null)
    }

    stripePromise = loadStripe(publishableKey)
  }

  return stripePromise
}

// Enhanced subscription management
export interface ISubscriptionPlan {
  id: string
  name: string
  price: number
  interval: 'month' | 'year'
  priceId: string
  features: string[]
  popular?: boolean
}

export const SUBSCRIPTION_PLANS: ISubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    priceId: '',
    features: [
      '14-day meal storage',
      '3 monthly shares',
      'Basic nutrition analysis',
      'Community access',
    ],
  },
  {
    id: 'premium-monthly',
    name: 'Premium Monthly',
    price: 4.99,
    interval: 'month',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_MONTHLY_PRICE_ID || '',
    features: [
      'Unlimited meal storage',
      'Unlimited shares',
      'Advanced nutrition analysis',
      '6 analysis modes',
      'Priority support',
      'Export capabilities',
    ],
  },
  {
    id: 'premium-yearly',
    name: 'Premium Yearly',
    price: 49.99,
    interval: 'year',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_YEARLY_PRICE_ID || '',
    popular: true,
    features: [
      'Unlimited meal storage',
      'Unlimited shares',
      'Advanced nutrition analysis',
      '6 analysis modes',
      'Priority support',
      'Export capabilities',
      '17% annual savings',
    ],
  },
]

export interface ICheckoutParams {
  priceId: string
  userId: string
  successUrl?: string
  cancelUrl?: string
  metadata?: Record<string, string>
}

export interface ICheckoutResult {
  url?: string
  error?: string
}

// Enhanced checkout session creation with better error handling
export async function createCheckoutSession({
  priceId,
  userId,
  successUrl,
  cancelUrl,
  metadata = {},
}: ICheckoutParams): Promise<ICheckoutResult> {
  try {
    if (!priceId || !userId) {
      return { error: 'Missing required parameters' }
    }

    const defaultSuccessUrl = `${window.location.origin}/?payment=success`
    const defaultCancelUrl = `${window.location.origin}/pricing?payment=cancelled`

    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        userId,
        successUrl: successUrl || defaultSuccessUrl,
        cancelUrl: cancelUrl || defaultCancelUrl,
        metadata: {
          ...metadata,
          userId,
          planType: priceId.includes('yearly') ? 'yearly' : 'monthly',
        },
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { error: data.error || 'Failed to create checkout session' }
    }

    return { url: data.url }
  } catch (error) {
    console.error('Checkout session creation error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

// Enhanced subscription management functions
export interface ISubscriptionStatus {
  isActive: boolean
  tier: 'free' | 'premium'
  status: string
  currentPeriodEnd?: Date
  cancelAtPeriodEnd?: boolean
  priceId?: string
}

export async function getSubscriptionStatus(userId: string): Promise<ISubscriptionStatus> {
  try {
    const supabase = createClientComponentClient()

    const { data: profile, error } = await supabase
      .from('profiles')
      .select(
        'subscription_tier, subscription_status, subscription_expires_at, stripe_subscription_id'
      )
      .eq('id', userId)
      .single()

    if (error || !profile) {
      return {
        isActive: false,
        tier: 'free',
        status: 'inactive',
      }
    }

    const isActive =
      profile.subscription_tier === 'premium' && profile.subscription_status === 'active'

    return {
      isActive,
      tier: profile.subscription_tier as 'free' | 'premium',
      status: profile.subscription_status,
      currentPeriodEnd: profile.subscription_expires_at
        ? new Date(profile.subscription_expires_at)
        : undefined,
    }
  } catch (error) {
    console.error('Error fetching subscription status:', error)
    return {
      isActive: false,
      tier: 'free',
      status: 'error',
    }
  }
}

// Customer portal redirect
export async function redirectToCustomerPortal(
  userId: string
): Promise<{ url?: string; error?: string }> {
  try {
    const response = await fetch('/api/stripe/portal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { error: data.error || 'Failed to create portal session' }
    }

    // Redirect to portal
    if (data.url) {
      window.location.href = data.url
      return { url: data.url }
    }

    return { error: 'No portal URL received' }
  } catch (error) {
    console.error('Portal redirect error:', error)
    return { error: 'Network error. Please try again.' }
  }
}

// Usage tracking utilities
export interface IUsageMetrics {
  mealCount: number
  monthlySharesUsed: number
  shareResetDate: Date
  remainingShares: number
}

export async function getUserUsage(userId: string): Promise<IUsageMetrics | null> {
  try {
    const supabase = createClientComponentClient()

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('meal_count, monthly_shares_used, share_reset_date, subscription_tier')
      .eq('id', userId)
      .single()

    if (error || !profile) {
      return null
    }

    const shareResetDate = new Date(profile.share_reset_date)
    const isPremium = profile.subscription_tier === 'premium'
    const maxShares = isPremium ? Infinity : 3
    const remainingShares = isPremium
      ? Infinity
      : Math.max(0, maxShares - profile.monthly_shares_used)

    return {
      mealCount: profile.meal_count,
      monthlySharesUsed: profile.monthly_shares_used,
      shareResetDate,
      remainingShares,
    }
  } catch (error) {
    console.error('Error fetching usage metrics:', error)
    return null
  }
}

// Enhanced error handling for Stripe operations
export function handleStripeError(error: StripeError): string {
  switch (error.code) {
    case 'card_declined':
      return 'Your card was declined. Please check your card details and try again.'
    case 'expired_card':
      return 'Your card has expired. Please use a different card.'
    case 'incorrect_cvc':
      return "Your card's security code is incorrect."
    case 'processing_error':
      return 'An error occurred while processing your card. Please try again.'
    case 'rate_limit':
      return 'Too many requests. Please wait a moment and try again.'
    default:
      return error.message || 'An unexpected error occurred. Please try again.'
  }
}

// Utility for plan comparison
export function formatPrice(price: number, interval: 'month' | 'year'): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(price)

  return `${formatted}/${interval === 'year' ? 'year' : 'month'}`
}

export function calculateYearlySavings(): number {
  const monthlyPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'premium-monthly')
  const yearlyPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'premium-yearly')

  if (!monthlyPlan || !yearlyPlan) {
    return 0
  }

  const monthlyTotal = monthlyPlan.price * 12
  const yearlySavings = monthlyTotal - yearlyPlan.price

  return Math.round((yearlySavings / monthlyTotal) * 100)
}
