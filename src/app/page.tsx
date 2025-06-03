'use client'

import { ArrowRight, Camera, Crown, Sparkles, Users, Zap } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { useAuth } from '@/contexts/AuthContext'

export default function HomePage(): React.ReactElement {
  const { user, profile, signOut, refreshMealCount } = useAuth()
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)

  useEffect(() => {
    if (user) {
      refreshMealCount()
    }
  }, [user, refreshMealCount])

  // Check for payment success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('payment') === 'success') {
      setShowPaymentSuccess(true)
      // Clean URL by removing the payment parameter
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
      // Auto-hide after 8 seconds
      setTimeout(() => setShowPaymentSuccess(false), 8000)
    }
  }, [])

  const handleSignOut = async (): Promise<void> => {
    try {
      console.log('🔐 Starting sign out process...')
      await signOut()
      console.log('✅ Sign out successful, redirecting...')

      // Force page refresh to clear any cached data
      window.location.href = '/login'
    } catch (error) {
      console.error('❌ Error signing out:', error)
      // Still redirect even if there's an error to clear the session
      window.location.href = '/login'
    }
  }

  return (
    <div className="from-brand-50 relative min-h-screen overflow-hidden bg-gradient-to-br to-orange-50">
      {/* Background Pattern */}
      <div className="pointer-events-none absolute inset-0 bg-[url('/patterns/food-pattern.svg')] opacity-5" />

      {/* Payment Success Banner */}
      {showPaymentSuccess && (
        <div className="fixed top-4 left-1/2 z-50 mx-auto max-w-md -translate-x-1/2 transform">
          <div className="flex animate-bounce items-center gap-3 rounded-xl border border-green-400 bg-green-500 px-6 py-4 text-white shadow-xl">
            <div className="text-2xl">🎉</div>
            <div>
              <p className="font-bold">Welcome to Premium!</p>
              <p className="text-sm opacity-90">Enjoy unlimited features and advanced insights!</p>
            </div>
            <button
              onClick={() => setShowPaymentSuccess(false)}
              className="ml-auto text-lg font-bold text-white hover:text-green-100"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Modern Navigation */}
      <nav className="sticky top-0 z-50 border-b border-white/20 bg-white/70 backdrop-blur-md">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="group flex items-center space-x-3">
              <div className="from-brand-500 flex h-10 w-10 transform items-center justify-center rounded-xl bg-gradient-to-r to-orange-500 transition-transform duration-300 group-hover:scale-110">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <h1 className="from-brand-600 bg-gradient-to-r to-orange-600 bg-clip-text text-2xl font-bold text-transparent">
                MealAppeal
              </h1>
            </Link>

            <div className="flex items-center gap-6">
              {user ? (
                <>
                  <div className="hidden items-center gap-6 md:flex">
                    <Link
                      href="/camera"
                      className="font-medium text-gray-600 transition-colors hover:text-gray-900"
                    >
                      Camera
                    </Link>
                    <Link
                      href="/meals"
                      className="font-medium text-gray-600 transition-colors hover:text-gray-900"
                    >
                      My Meals
                    </Link>
                    <Link
                      href="/community"
                      className="font-medium text-gray-600 transition-colors hover:text-gray-900"
                    >
                      Community
                    </Link>
                  </div>

                  <div className="flex items-center gap-4">
                    {profile?.subscription_tier !== 'premium' && (
                      <Link
                        href="/upgrade"
                        className="from-brand-500 flex transform items-center gap-2 rounded-full bg-gradient-to-r to-orange-500 px-4 py-2 text-sm font-medium text-white transition-all hover:scale-105 hover:shadow-lg"
                      >
                        <Crown className="h-4 w-4" />
                        <span>Upgrade</span>
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
                    >
                      Sign Out
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    href="/login"
                    className="px-4 py-2 font-medium text-gray-600 transition-colors hover:text-gray-900"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/signup"
                    className="from-brand-500 transform rounded-xl bg-gradient-to-r to-orange-500 px-6 py-2 font-medium text-white transition-all hover:scale-105 hover:shadow-lg"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative">
        <div className="container py-20">
          {/* Hero Section */}
          <div className="mx-auto max-w-4xl space-y-8 text-center">
            <div className="space-y-6">
              {user && profile ? (
                <>
                  <h2 className="text-5xl leading-tight font-bold text-gray-900">
                    Welcome back,
                    <span className="from-brand-600 block bg-gradient-to-r to-orange-600 bg-clip-text text-transparent">
                      {profile.full_name?.split(' ')[0] || 'Friend'}! 👋
                    </span>
                  </h2>
                  <p className="mx-auto max-w-2xl text-xl leading-relaxed text-gray-600">
                    Ready to discover what&apos;s in your next meal? You&apos;ve captured{' '}
                    {profile.meal_count || 0} meals so far - let&apos;s make it one more! 🍽️✨
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-6xl leading-tight font-bold text-gray-900">
                    Transform Every Meal Into Your
                    <span className="from-brand-600 block bg-gradient-to-r to-orange-600 bg-clip-text text-transparent">
                      Personal Nutrition Coach
                    </span>
                  </h2>
                  <p className="mx-auto max-w-2xl text-xl leading-relaxed text-gray-600">
                    Stop guessing what&apos;s in your food. Point, shoot, and discover the complete
                    story behind every meal – from calories and nutrients to cultural origins and
                    smart ingredient swaps.
                  </p>
                </>
              )}
            </div>

            {/* Key Benefits */}
            <div className="mt-12 mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="transform transition-all duration-300 hover:scale-105">
                <div className="rounded-xl border border-white/20 bg-white/80 p-6 shadow-lg backdrop-blur-sm">
                  <div className="mb-3 text-3xl">⚡</div>
                  <h3 className="mb-2 font-semibold text-gray-900">See Results in Seconds</h3>
                  <p className="text-sm text-gray-600">
                    Get instant nutrition insights the moment you snap a photo
                  </p>
                </div>
              </div>
              <div className="transform transition-all duration-300 hover:scale-105">
                <div className="rounded-xl border border-white/20 bg-white/80 p-6 shadow-lg backdrop-blur-sm">
                  <div className="mb-3 text-3xl">🌱</div>
                  <h3 className="mb-2 font-semibold text-gray-900">Make Better Choices</h3>
                  <p className="text-sm text-gray-600">
                    Discover healthier alternatives and hidden ingredients you never knew about
                  </p>
                </div>
              </div>
              <div className="transform transition-all duration-300 hover:scale-105">
                <div className="rounded-xl border border-white/20 bg-white/80 p-6 shadow-lg backdrop-blur-sm">
                  <div className="mb-3 text-3xl">📖</div>
                  <h3 className="mb-2 font-semibold text-gray-900">Learn Food Stories</h3>
                  <p className="text-sm text-gray-600">
                    Explore cultural origins and fascinating facts behind your favorite dishes
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="mx-auto flex max-w-lg flex-col justify-center gap-4 sm:flex-row">
              <Link
                href={user ? '/camera' : '/signup'}
                className="from-brand-600 flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r to-orange-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:scale-105 hover:shadow-xl"
              >
                <Camera className="h-6 w-6" />
                {user ? 'Start Discovering' : 'Try Free for 14 Days'}
              </Link>

              {!user && (
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-3 rounded-xl border-2 border-gray-300 bg-white px-8 py-4 text-lg font-semibold text-gray-700 transition-all hover:scale-105 hover:bg-gray-50 hover:shadow-xl"
                >
                  I Have an Account
                </Link>
              )}
            </div>

            {/* Social Proof */}
            <div className="mt-12 text-center">
              <p className="mb-4 text-gray-500">
                Trusted by health-conscious food lovers worldwide
              </p>
              <div className="flex items-center justify-center gap-8 text-sm text-gray-400">
                <span className="flex items-center gap-2">
                  <span className="text-yellow-400">★★★★★</span>
                  <span>4.9 rating</span>
                </span>
                <span>•</span>
                <span>10,000+ meals analyzed daily</span>
                <span>•</span>
                <span>Join thousands discovering food freedom</span>
              </div>
            </div>
          </div>

          {/* User Dashboard */}
          {user && profile && (
            <div className="mx-auto mt-16 max-w-2xl transform rounded-2xl border border-white/20 bg-white/80 p-8 shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]">
              <div className="mb-6 text-center">
                <h3 className="from-brand-600 mb-2 bg-gradient-to-r to-orange-600 bg-clip-text text-2xl font-bold text-transparent">
                  Your Food Journey Stats
                </h3>
                <p className="text-gray-600">Track your progress and unlock achievements</p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl bg-white/50 p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📸</span>
                      <span className="font-medium">Meals Captured</span>
                    </div>
                    <span className="text-brand-600 text-xl font-bold">
                      {profile.meal_count || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-white/50 p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🔄</span>
                      <span className="font-medium">Shares Left</span>
                    </div>
                    <span className="text-xl font-bold text-orange-600">
                      {profile.subscription_tier === 'premium'
                        ? '∞'
                        : `${3 - (profile.monthly_shares_used || 0)}`}
                    </span>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl bg-white/50 p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⏳</span>
                      <span className="font-medium">Storage Days</span>
                    </div>
                    <span className="text-xl font-bold text-purple-600">
                      {profile.subscription_tier === 'premium' ? '∞' : '14'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-white/50 p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {profile.subscription_tier === 'premium' ? '👑' : '⭐'}
                      </span>
                      <span className="font-medium">Your Plan</span>
                    </div>
                    <span className="text-xl font-bold text-yellow-600">
                      {profile.subscription_tier === 'premium' ? 'PRO' : 'FREE'}
                    </span>
                  </div>
                </div>
              </div>

              {profile.subscription_tier === 'free' && (
                <div className="mt-8 border-t border-white/10 pt-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>Join 10,000+ food enthusiasts using MealAppeal</span>
                    </div>
                    <Link
                      href="/upgrade"
                      className="text-brand-600 hover:text-brand-700 inline-flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                      Compare Plans
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Non-Authenticated User Call-to-Action */}
          {!user && (
            <div className="mx-auto mt-16 max-w-2xl transform rounded-2xl border border-white/20 bg-white/80 p-8 text-center shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]">
              <div className="mb-6">
                <div className="from-brand-100 mx-auto mb-4 flex h-20 w-20 transform items-center justify-center rounded-full bg-gradient-to-br to-orange-100 transition-transform duration-300 hover:scale-110">
                  <Camera className="text-brand-600 h-10 w-10" />
                </div>
                <h3 className="mb-3 text-2xl font-bold">
                  Join 10,000+ discovering their food&apos;s secrets! 🔍
                </h3>
                <p className="mx-auto max-w-lg text-gray-600">
                  Get instant nutrition insights, track your meals, and share your food journey with
                  our growing community.
                </p>
              </div>

              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/signup"
                  className="from-brand-500 w-full transform rounded-xl bg-gradient-to-r to-orange-500 px-6 py-3 text-center font-semibold text-white transition-all hover:scale-105 hover:shadow-lg sm:w-auto"
                >
                  🚀 Start Your Food Journey
                </Link>
                <Link
                  href="/login"
                  className="w-full rounded-xl border border-gray-300 bg-white px-6 py-3 text-center font-semibold text-gray-700 transition-all hover:bg-gray-50 sm:w-auto"
                >
                  Already have an account?
                </Link>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4 text-center text-sm md:grid-cols-4">
                <div className="text-gray-600">
                  <span className="mb-1 block text-lg">🔍</span>
                  Instant Insights
                </div>
                <div className="text-gray-600">
                  <span className="mb-1 block text-lg">📊</span>
                  Nutrition Facts
                </div>
                <div className="text-gray-600">
                  <span className="mb-1 block text-lg">📱</span>
                  Mobile Optimized
                </div>
                <div className="text-gray-600">
                  <span className="mb-1 block text-lg">🌟</span>
                  Free to Start
                </div>
              </div>
            </div>
          )}

          {/* Feature Cards */}
          <div className="mt-20 grid gap-8 md:grid-cols-3">
            {/* Instant Discovery */}
            <div className="transform space-y-4 rounded-2xl border border-white/20 bg-white/80 p-8 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="from-brand-100 to-brand-200 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br">
                <Camera className="text-brand-600 h-7 w-7" />
              </div>
              <h3 className="text-2xl font-semibold">Instant Food Discovery</h3>
              <p className="leading-relaxed text-gray-600">
                Point your camera at any meal and instantly discover what&apos;s inside. Get
                complete nutrition facts, hidden ingredients, and personalized health insights in
                seconds.
              </p>
              <div className="pt-2">
                <span className="text-brand-600 inline-flex items-center gap-1 text-sm font-medium">
                  <span className="text-yellow-400">★</span>
                  Works with any food, anywhere
                </span>
              </div>
            </div>

            {/* Smart Nutrition Coach */}
            <div className="transform space-y-4 rounded-2xl border border-white/20 bg-white/80 p-8 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200">
                <Zap className="h-7 w-7 text-orange-600" />
              </div>
              <h3 className="text-2xl font-semibold">Your Personal Nutrition Coach</h3>
              <p className="leading-relaxed text-gray-600">
                Get tailored advice for your dietary goals. Whether you&apos;re losing weight,
                building muscle, or managing health conditions, discover exactly what your body
                needs.
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1 text-sm font-medium text-orange-600">
                  <span className="text-yellow-400">★</span>
                  Personalized for your goals
                </span>
              </div>
            </div>

            {/* Cultural Food Stories */}
            <div className="transform space-y-4 rounded-2xl border border-white/20 bg-white/80 p-8 backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-xl">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-purple-200">
                <Sparkles className="h-7 w-7 text-purple-600" />
              </div>
              <h3 className="text-2xl font-semibold">Food Stories & Culture</h3>
              <p className="leading-relaxed text-gray-600">
                Discover the fascinating stories behind your meals. Learn about cultural origins,
                traditional preparation methods, and share your food adventures with friends.
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1 text-sm font-medium text-purple-600">
                  <span className="text-yellow-400">★</span>
                  Turn every meal into a story
                </span>
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="mx-auto mt-20 max-w-4xl text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900">How It Works</h2>
            <p className="mb-12 text-xl text-gray-600">
              Three simple steps to unlock your food&apos;s secrets
            </p>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="from-brand-500 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r to-orange-500 text-2xl font-bold text-white">
                  1
                </div>
                <h3 className="mb-2 text-xl font-semibold">📸 Point & Shoot</h3>
                <p className="text-gray-600">
                  Simply point your camera at any meal and take a photo. Works with home-cooked
                  meals, restaurant dishes, or packaged foods.
                </p>
              </div>

              <div className="text-center">
                <div className="from-brand-500 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r to-orange-500 text-2xl font-bold text-white">
                  2
                </div>
                <h3 className="mb-2 text-xl font-semibold">⚡ Get Instant Insights</h3>
                <p className="text-gray-600">
                  Within seconds, see complete nutrition facts, ingredient lists, allergy warnings,
                  and personalized health recommendations.
                </p>
              </div>

              <div className="text-center">
                <div className="from-brand-500 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r to-orange-500 text-2xl font-bold text-white">
                  3
                </div>
                <h3 className="mb-2 text-xl font-semibold">🌟 Make Better Choices</h3>
                <p className="text-gray-600">
                  Use your insights to make healthier choices, track your progress, and share your
                  food discoveries with friends and family.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/50 backdrop-blur-sm">
        <div className="container py-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            {/* Brand */}
            <div className="space-y-4">
              <Link href="/" className="group flex items-center space-x-3">
                <div className="from-brand-500 flex h-10 w-10 transform items-center justify-center rounded-xl bg-gradient-to-r to-orange-500 transition-transform duration-300 group-hover:scale-110">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <h1 className="from-brand-600 bg-gradient-to-r to-orange-600 bg-clip-text text-2xl font-bold text-transparent">
                  MealAppeal
                </h1>
              </Link>
              <p className="text-sm text-gray-600">
                Your personal nutrition coach that reveals the complete story behind every meal.
              </p>
            </div>

            {/* Company */}
            <div>
              <h3 className="mb-4 text-sm font-semibold tracking-wider text-gray-500 uppercase">
                Company
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/about"
                    className="text-sm text-gray-600 transition-colors hover:text-gray-900"
                  >
                    About MealAppeal
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:fit@mealappeal.app"
                    className="text-sm text-gray-600 transition-colors hover:text-gray-900"
                  >
                    Contact Us
                  </a>
                </li>
                <li>
                  <Link
                    href="/careers"
                    className="text-sm text-gray-600 transition-colors hover:text-gray-900"
                  >
                    Careers
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="mb-4 text-sm font-semibold tracking-wider text-gray-500 uppercase">
                Legal
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    href="/privacy"
                    className="text-sm text-gray-600 transition-colors hover:text-gray-900"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-sm text-gray-600 transition-colors hover:text-gray-900"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h3 className="mb-4 text-sm font-semibold tracking-wider text-gray-500 uppercase">
                Connect
              </h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="https://twitter.com/mealappeal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-600 transition-colors hover:text-gray-900"
                  >
                    Twitter
                  </a>
                </li>
                <li>
                  <a
                    href="https://instagram.com/mealappeal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-600 transition-colors hover:text-gray-900"
                  >
                    Instagram
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 border-t border-gray-200 pt-8 text-center">
            <p className="text-sm text-gray-600">© 2025 MealAppeal. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
