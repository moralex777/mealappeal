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
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold">🚀 Upgrade to Premium</h1>
          <p className="text-muted-foreground text-xl">
            Unlock the full potential of your food journey
          </p>
        </div>

        {/* Plans Grid */}
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {/* Monthly Plan */}
          <div className="rounded-2xl border-2 border-gray-200 bg-white p-8">
            <h3 className="mb-2 text-2xl font-bold text-gray-900">Monthly Premium</h3>
            <div className="mb-6 text-4xl font-bold text-green-600">
              $4.99<span className="text-lg text-gray-600">/month</span>
            </div>
            <button
              onClick={() => handleSubscribe('monthly')}
              disabled={loading === 'monthly'}
              className="mb-6 w-full rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
            >
              {loading === 'monthly' ? (
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                'Start Monthly Plan'
              )}
            </button>
            <ul className="space-y-3 text-gray-700">
              <li>✓ Unlimited meal storage</li>
              <li>✓ Advanced nutrition insights</li>
              <li>✓ Unlimited public sharing</li>
              <li>✓ Smart meal recommendations</li>
              <li>✓ Export nutrition data</li>
              <li>✓ Priority support</li>
            </ul>
          </div>

          {/* Yearly Plan */}
          <div className="relative rounded-2xl border-2 border-green-500 bg-green-50 p-8">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
              <span className="rounded-full bg-green-500 px-4 py-1 text-sm font-semibold text-white">
                Save 17%
              </span>
            </div>
            <h3 className="mb-2 text-2xl font-bold text-gray-900">Yearly Premium</h3>
            <div className="mb-6 text-4xl font-bold text-green-600">
              $49.99<span className="text-lg text-gray-600">/year</span>
            </div>
            <button
              onClick={() => handleSubscribe('yearly')}
              disabled={loading === 'yearly'}
              className="mb-6 w-full rounded-xl bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
            >
              {loading === 'yearly' ? (
                <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                'Start Yearly Plan'
              )}
            </button>
            <ul className="space-y-3 text-gray-700">
              <li>✓ Unlimited meal storage</li>
              <li>✓ Advanced nutrition insights</li>
              <li>✓ Unlimited public sharing</li>
              <li>✓ Smart meal recommendations</li>
              <li>✓ Export nutrition data</li>
              <li>✓ Priority support</li>
            </ul>
          </div>
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

        {/* Security Notice */}
        <div className="text-muted-foreground text-center text-sm">
          🔒 Secure payments powered by Stripe • Cancel anytime • 30-day money-back guarantee
        </div>
      </div>
    </div>
  )
}
