'use client'

import { useState } from 'react'

import { useAuth } from '@/contexts/AuthContext'

export default function UpgradePage(): React.ReactNode {
  const { user } = useAuth()
  const [loading, setLoading] = useState<'monthly' | 'yearly' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async (planType: 'monthly' | 'yearly'): Promise<void> => {
    try {
      setLoading(planType)
      setError(null)

      if (!user) {
        window.location.href = '/login'
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

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url
      } else {
        throw new Error('No checkout URL received')
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
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">🚀 Upgrade to Premium</h1>
          <p className="text-xl text-gray-600">Unlock the full potential of your food journey</p>
        </div>

        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {/* Monthly Plan - Smaller, Less Prominent */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="mb-2 text-xl font-semibold text-gray-700">Monthly Premium</h3>
            <div className="mb-4 text-3xl font-bold text-gray-700">
              $4.99<span className="text-base text-gray-500">/month</span>
            </div>
            <div className="mb-4 text-sm text-gray-500">$59.88 billed annually</div>
            <button
              onClick={() => handleSubscribe('monthly')}
              disabled={loading === 'monthly'}
              className="mb-4 w-full rounded-lg bg-gray-600 px-4 py-2 font-medium text-white hover:bg-gray-700"
            >
              {loading === 'monthly' ? (
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                'Start Monthly Plan'
              )}
            </button>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✓ Unlimited meal storage</li>
              <li>✓ Advanced nutrition insights</li>
              <li>✓ Unlimited public sharing</li>
              <li>✓ Smart meal recommendations</li>
              <li>✓ Export nutrition data</li>
              <li>✓ Priority support</li>
            </ul>
          </div>

          {/* Yearly Plan - PROMOTED & HIGHLIGHTED */}
          <div className="relative scale-105 transform rounded-xl border-3 border-green-500 bg-gradient-to-br from-green-50 to-green-100 p-8 shadow-xl">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
              <span className="rounded-full bg-green-500 px-6 py-2 text-sm font-bold text-white">
                🎉 SAVE 17% - BEST VALUE
              </span>
            </div>
            <div className="absolute top-4 right-4">
              <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">
                MOST POPULAR
              </span>
            </div>
            <h3 className="mb-2 text-2xl font-bold text-green-800">Yearly Premium</h3>
            <div className="mb-2 text-4xl font-bold text-green-600">
              $49.99<span className="text-lg text-green-500">/year</span>
            </div>
            <div className="mb-6 text-sm text-green-700">
              Only $4.17/month • Save $9.89 vs monthly
            </div>
            <button
              onClick={() => handleSubscribe('yearly')}
              disabled={loading === 'yearly'}
              className="mb-6 w-full rounded-xl bg-green-600 px-6 py-4 text-lg font-bold text-white shadow-lg hover:bg-green-700"
            >
              {loading === 'yearly' ? (
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                '🚀 Start Yearly Plan - SAVE 17%'
              )}
            </button>
            <ul className="space-y-3 text-green-800">
              <li>
                <strong>✓ Unlimited meal storage</strong>
              </li>
              <li>
                <strong>✓ Advanced nutrition insights</strong>
              </li>
              <li>
                <strong>✓ Unlimited public sharing</strong>
              </li>
              <li>
                <strong>✓ Smart meal recommendations</strong>
              </li>
              <li>
                <strong>✓ Export nutrition data</strong>
              </li>
              <li>
                <strong>✓ Priority support</strong>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="mb-2 font-semibold text-green-600">
            💝 Limited Time: Save 17% with yearly plan
          </p>
          <p className="text-gray-600">
            🔒 Secure payments powered by Stripe • Cancel anytime • 30-day money-back guarantee
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4 text-center">
            <div className="text-red-600">{error}</div>
            <div className="mt-2 text-sm text-red-500">
              Try refreshing the page or contact support if the issue persists.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
