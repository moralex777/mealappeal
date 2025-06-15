'use client'

import { CheckCircle, Crown, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { AppLayout } from '@/components/AppLayout'
import { useAuth } from '@/contexts/AuthContext'

export default function UpgradeSuccessPage() {
  const { user, profile, refreshMealCount } = useAuth()
  const searchParams = useSearchParams()
  const [isVerifying, setIsVerifying] = useState(true)
  const [verificationSuccess, setVerificationSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setError('No session ID found. Please contact support if you completed a payment.')
        setIsVerifying(false)
        return
      }

      try {
        // Verify the payment session
        const response = await fetch('/api/stripe/verify-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        })

        if (response.ok) {
          setVerificationSuccess(true)
          // Refresh user profile to get updated subscription status
          await refreshMealCount()
        } else {
          setError('Payment verification failed. Please contact support.')
        }
      } catch (err) {
        console.error('Payment verification error:', err)
        setError('Unable to verify payment. Please contact support.')
      } finally {
        setIsVerifying(false)
      }
    }

    verifyPayment()
  }, [sessionId, refreshMealCount])

  if (isVerifying) {
    return (
      <AppLayout>
        <div className="from-brand-50 min-h-screen bg-gradient-to-br to-orange-50 p-4">
        <div className="container mx-auto max-w-2xl pt-20">
          <div className="rounded-2xl border border-white/20 bg-white/90 p-8 text-center shadow-xl backdrop-blur-sm">
            <div className="border-brand-200 border-t-brand-600 mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4"></div>
            <h1 className="mb-4 text-2xl font-bold text-gray-900">Verifying Your Payment...</h1>
            <p className="text-gray-600">
              We're confirming your premium upgrade. This should only take a moment.
            </p>
          </div>
        </div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="from-brand-50 min-h-screen bg-gradient-to-br to-orange-50 p-4">
        <div className="container mx-auto max-w-2xl pt-20">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-xl">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <span className="text-2xl">😔</span>
            </div>
            <h1 className="mb-4 text-2xl font-bold text-red-900">Payment Verification Issue</h1>
            <p className="mb-6 text-red-700">{error}</p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/meals"
                className="rounded-xl bg-gray-100 px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-200"
              >
                Back to App
              </Link>
              <a
                href="mailto:support@mealappeal.app?subject=Payment%20Verification%20Issue"
                className="from-brand-500 rounded-xl bg-gradient-to-r to-orange-500 px-6 py-3 font-semibold text-white transition-colors hover:shadow-lg"
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="from-brand-50 min-h-screen bg-gradient-to-br to-orange-50 p-4">
      <div className="container mx-auto max-w-2xl pt-20">
        {/* Success Animation */}
        <div className="mb-8 text-center">
          <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
            {/* Animated success circle */}
            <div className="absolute inset-0 animate-ping rounded-full bg-green-400 opacity-20"></div>
            <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-green-500">
              <CheckCircle className="h-12 w-12 text-white" />
            </div>
          </div>

          {/* Celebration particles */}
          <div className="relative">
            <h1 className="mb-4 text-4xl font-bold text-gray-900">🎉 Welcome to Premium!</h1>
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce text-2xl">
              <Sparkles className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Success Card */}
        <div className="rounded-2xl border border-white/20 bg-white/90 p-8 shadow-xl backdrop-blur-sm">
          {/* Premium Badge */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 to-orange-500">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Premium Activated!</h2>
            <p className="text-gray-600">
              Your subscription is now active. Enjoy unlimited features!
            </p>
          </div>

          {/* Premium Features */}
          <div className="mb-8 space-y-4">
            <h3 className="font-semibold text-gray-900">What you now have access to:</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg bg-green-50 p-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-800">Unlimited meal storage</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-green-50 p-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-800">Unlimited sharing</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-green-50 p-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-800">6 premium insight modes</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-green-50 p-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-800">Advanced nutrition insights</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/camera"
              className="from-brand-600 flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r to-orange-600 px-6 py-4 font-semibold text-white transition-all hover:scale-105 hover:shadow-lg"
            >
              <span className="text-xl">📸</span>
              Try Premium Features
            </Link>
            <Link
              href="/meals"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-4 font-semibold text-gray-700 transition-all hover:bg-gray-50"
            >
              View My Meals
            </Link>
          </div>

          {/* Support Note */}
          <div className="mt-6 rounded-lg bg-blue-50 p-4 text-center">
            <p className="text-sm text-blue-800">
              Need help? Email us at{' '}
              <a
                href="mailto:support@mealappeal.app"
                className="font-medium underline hover:no-underline"
              >
                support@mealappeal.app
              </a>
            </p>
          </div>
        </div>

        {/* User Status Display */}
        {user && profile && (
          <div className="mt-6 rounded-xl bg-white/50 p-4 text-center backdrop-blur-sm">
            <p className="text-sm text-gray-600">
              Welcome back, <span className="font-medium">{profile.full_name || user.email}</span>!
              Your premium subscription is now active.
            </p>
          </div>
        )}
      </div>
      </div>
    </AppLayout>
  )
}
