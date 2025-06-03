'use client'

import { ArrowLeft, Crown, Heart, Zap } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { useAuth } from '@/contexts/AuthContext'

export default function UpgradeCancelPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [countdown, setCountdown] = useState(10)

  // Auto-redirect countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          router.push('/meals')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="from-brand-50 min-h-screen bg-gradient-to-br to-orange-50 p-4">
      <div className="container mx-auto max-w-2xl pt-20">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100">
            <span className="text-3xl">😔</span>
          </div>
          <h1 className="mb-4 text-3xl font-bold text-gray-900">We understand!</h1>
          <p className="text-lg text-gray-600">
            Premium isn't for everyone right now. No worries at all!
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-2xl border border-white/20 bg-white/90 p-8 shadow-xl backdrop-blur-sm">
          {/* What they're missing */}
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              You can still enjoy MealAppeal for free:
            </h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg bg-green-50 p-3">
                <span className="text-xl">📸</span>
                <span className="text-green-800">Capture and analyze any meal</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-3">
                <span className="text-xl">📊</span>
                <span className="text-blue-800">Get basic nutrition insights</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-purple-50 p-3">
                <span className="text-xl">⏳</span>
                <span className="text-purple-800">14 days of meal storage</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-orange-50 p-3">
                <span className="text-xl">🔄</span>
                <span className="text-orange-800">3 monthly shares with friends</span>
              </div>
            </div>
          </div>

          {/* Alternative options */}
          <div className="mb-8 rounded-xl border border-yellow-200 bg-yellow-50 p-6">
            <div className="mb-4 flex items-center gap-3">
              <Crown className="h-6 w-6 text-yellow-600" />
              <h3 className="font-semibold text-yellow-900">Maybe premium later?</h3>
            </div>
            <p className="mb-4 text-sm text-yellow-800">
              Try MealAppeal free first. When you're ready for unlimited storage, advanced insights,
              and all 6 premium modes, we'll be here!
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-2 rounded-lg bg-white/50 p-3">
                <Heart className="h-5 w-5 text-red-500" />
                <span className="text-sm text-yellow-800">Save your favorite meals</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/50 p-3">
                <Zap className="h-5 w-5 text-yellow-500" />
                <span className="text-sm text-yellow-800">6 specialized insight modes</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/camera"
                className="from-brand-600 flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r to-orange-600 px-6 py-4 font-semibold text-white transition-all hover:scale-105 hover:shadow-lg"
              >
                <span className="text-xl">📸</span>
                Start Using Free Version
              </Link>
              <Link
                href="/upgrade"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-purple-300 bg-purple-50 px-6 py-4 font-semibold text-purple-700 transition-all hover:bg-purple-100"
              >
                <Crown className="h-5 w-5" />
                Maybe Premium Later
              </Link>
            </div>

            {/* Quick back option */}
            <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
              <span>Redirecting to your meals in {countdown}s</span>
              <span>•</span>
              <Link
                href="/meals"
                className="flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Now
              </Link>
            </div>
          </div>
        </div>

        {/* Special offer (for future use) */}
        <div className="mt-6 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-center text-white">
          <h3 className="mb-2 text-lg font-bold">🎁 First Month 50% Off</h3>
          <p className="mb-4 text-sm opacity-90">
            Try premium for just $2.49 your first month. Cancel anytime.
          </p>
          <Link
            href="/upgrade?promo=FIRST50"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-purple-600 transition-all hover:scale-105"
          >
            <Crown className="h-5 w-5" />
            Claim 50% Off
          </Link>
        </div>

        {/* User status */}
        {user && (
          <div className="mt-6 rounded-xl bg-white/50 p-4 text-center backdrop-blur-sm">
            <p className="text-sm text-gray-600">
              Thanks for trying MealAppeal,{' '}
              <span className="font-medium">{profile?.full_name || user.email}</span>! We're here
              when you're ready to upgrade.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
