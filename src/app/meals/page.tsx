'use client'

import { ArrowRight, Camera, Clock, Crown, Users } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import ErrorBoundary from '@/components/ErrorBoundary'
import { MealCard } from '@/components/MealCard'
import MealCardSkeleton from '@/components/MealCardSkeleton'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import type { IMealCardProps } from '@/lib/types'

type Meal = IMealCardProps['meal']

export default function MealsPage() {
  const { user, profile, isLoading: authLoading, refreshMealCount } = useAuth()
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)

  // Memoized utility functions
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    })
  }, [])

  const getDaysLeft = useCallback(
    (deletionDate: string | null) => {
      if (!deletionDate || profile?.subscription_tier === 'premium') {
        return 'Unlimited'
      }
      const deletion = new Date(deletionDate)
      const now = new Date()
      const diffTime = deletion.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return Math.max(0, diffDays)
    },
    [profile?.subscription_tier]
  )

  // Get minimum days left across all meals for stats display
  const getMinDaysLeft = useCallback(() => {
    if (profile?.subscription_tier === 'premium') {
      return 'Unlimited'
    }
    if (meals.length === 0) {
      return '14'
    }

    const now = new Date()
    const daysLeftArray = meals
      .filter(meal => meal.scheduled_deletion_date)
      .map(meal => {
        const deletion = new Date(meal.scheduled_deletion_date!)
        const diffTime = deletion.getTime() - now.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        return Math.max(0, diffDays)
      })

    if (daysLeftArray.length === 0) {
      return '14'
    }
    const minDays = Math.min(...daysLeftArray)
    return minDays === 0 ? 'Expiring today!' : minDays.toString()
  }, [meals, profile?.subscription_tier])

  // Enhanced fetch function with error handling
  const fetchMeals = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (!user?.id) {
        throw new Error('User ID is missing. Please sign in again.')
      }

      console.log('🔄 Fetching meals for user:', user.id)
      console.log('Current user:', user)
      console.log('Fetching meals for user_id:', user?.id)

      // First verify user's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_tier, meal_count')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        throw new Error(`Failed to load profile: ${profileError.message}`)
      }

      if (!profileData) {
        throw new Error('Profile not found')
      }

      setUserProfile(profileData)
      console.log('✅ Profile loaded:', profileData)

      // Fetch meals with detailed error handling - FIXED QUERY FOR ACTUAL SCHEMA
      const { data: mealsData, error: mealsError } = await supabase
        .from('meals')
        .select(
          `
          id,
          user_id,
          created_at,
          title,
          description,
          image_url,
          image_path,
          is_public,
          ai_confidence_score,
          processing_status,
          scheduled_deletion_date,
          view_count,
          like_count,
          basic_nutrition,
          premium_nutrition,
          health_score,
          meal_tags
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      console.log('📊 Raw meals query result:', { data: mealsData, error: mealsError })

      if (mealsError) {
        console.error('Meals fetch error details:', {
          message: mealsError.message,
          details: mealsError.details,
          hint: mealsError.hint,
          code: mealsError.code,
        })
        throw new Error(
          `Database error: ${mealsError.message || 'Unknown error'}. Code: ${mealsError.code || 'N/A'}`
        )
      }

      if (!mealsData) {
        throw new Error('No meal data received from the database.')
      }

      console.log(`✅ Successfully fetched ${mealsData.length} meals`)
      console.log('Fetched meals:', mealsData)
      console.log('Meals length:', mealsData?.length)

      // Validate meal data and handle individual nutrition columns
      const validMeals = mealsData.filter(meal => {
        if (!meal || !meal.image_url) {
          console.warn('⚠️ Invalid meal data - missing required fields:', meal)
          return false
        }

        // Validate meal object structure without creating unused variable
        if (
          typeof meal.id !== 'string' ||
          typeof meal.created_at !== 'string' ||
          typeof meal.image_url !== 'string' ||
          (meal.scheduled_deletion_date !== null &&
            typeof meal.scheduled_deletion_date !== 'string')
        ) {
          console.warn('⚠️ Invalid meal data types:', meal)
          return false
        }

        return true
      })

      if (validMeals.length < mealsData.length) {
        console.warn(`⚠️ Filtered out ${mealsData.length - validMeals.length} invalid meals`)
      }

      console.log('✅ Valid meals after filtering:', validMeals.length)
      console.log('✅ Valid meals data:', validMeals)

      // Cast the meals to the correct type before setting state - FIXED DATA MAPPING
      const mappedMeals = validMeals.map(meal => ({
        id: meal.id,
        created_at: meal.created_at,
        image_url: meal.image_url,
        scheduled_deletion_date: meal.scheduled_deletion_date,
        analysis: {
          name: meal.title || 'Delicious Meal',
          calories: meal.basic_nutrition?.energy_kcal || 0,
          protein: meal.basic_nutrition?.protein_g || 0,
          carbs: meal.basic_nutrition?.carbs_g || 0,
          fat: meal.basic_nutrition?.fat_g || 0,
        },
      }))

      console.log('🎯 Final mapped meals for display:', mappedMeals)

      setMeals(mappedMeals)

      // Refresh meal count in profile after fetching meals
      await refreshMealCount()

      // Check for expiring meals
      const expiringMeals = validMeals.filter(meal => {
        if (!meal.scheduled_deletion_date) {
          return false
        }
        const daysLeft = getDaysLeft(meal.scheduled_deletion_date)
        return typeof daysLeft === 'number' && daysLeft <= 3
      })

      if (expiringMeals.length > 0 && profileData.subscription_tier === 'free') {
        console.log(`⚠️ ${expiringMeals.length} meals expiring soon!`)
      }
    } catch (err) {
      console.error('🚨 Error in fetchMeals:', err)
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(`😅 Oops! ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }, [user?.id, refreshMealCount, getDaysLeft])

  useEffect(() => {
    console.log('🔄 useEffect triggered - authLoading:', authLoading, 'user:', user?.id)
    if (!authLoading) {
      if (user) {
        console.log('🔄 Initializing meals page for user:', user.id)
        fetchMeals()
      } else {
        console.log('⚠️ No authenticated user, redirecting to login')
        window.location.href = '/login'
      }
    }
  }, [user, authLoading, fetchMeals])

  console.log(
    '🎯 Rendering meals page - loading:',
    loading,
    'meals count:',
    meals.length,
    'error:',
    error
  )

  if (loading) {
    return (
      <div className="from-brand-50 min-h-screen bg-gradient-to-br to-orange-50 p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <MealCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="from-brand-50 min-h-screen bg-gradient-to-br to-orange-50 p-4">
        <div className="container mx-auto max-w-4xl">
          <ErrorBoundary>
            <div className="py-20 text-center">
              <p className="mb-4 text-red-600">{error}</p>
              <button
                onClick={fetchMeals}
                className="bg-brand-600 hover:bg-brand-700 transform rounded-lg px-6 py-3 text-white transition-all hover:scale-105"
              >
                🔄 Try Again
              </button>
            </div>
          </ErrorBoundary>
        </div>
      </div>
    )
  }

  return (
    <div className="from-brand-50 min-h-screen bg-gradient-to-br to-orange-50 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Stats Hero Section */}
        <div className="mb-12">
          {/* Welcome Banner */}
          <div className="mb-6 text-center">
            <h1 className="from-brand-600 bg-gradient-to-r to-orange-600 bg-clip-text text-3xl font-bold text-transparent">
              Hey {profile?.full_name?.split(' ')[0] || 'there'}, here's your food journey! 🌟
            </h1>
          </div>

          {/* Stats Grid */}
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {/* Meals Captured */}
            <div className="transform rounded-2xl border border-white/20 bg-white/90 p-6 shadow-xl backdrop-blur-sm transition-all hover:scale-105">
              <div className="flex flex-col items-center text-center">
                <div className="from-brand-100 mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br to-orange-100">
                  <Camera className="text-brand-600 h-6 w-6" />
                </div>
                <span className="text-brand-600 text-3xl font-bold">
                  {profile?.meal_count || 0}
                </span>
                <span className="text-muted-foreground mt-1 text-sm">Meals Captured</span>
              </div>
            </div>

            {/* Monthly Shares */}
            <div className="transform rounded-2xl border border-white/20 bg-white/90 p-6 shadow-xl backdrop-blur-sm transition-all hover:scale-105">
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-orange-100 to-yellow-100">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <span className="text-3xl font-bold text-orange-600">
                  {profile?.subscription_tier === 'premium'
                    ? '∞'
                    : `${3 - (profile?.monthly_shares_used || 0)}`}
                </span>
                <span className="text-muted-foreground mt-1 text-sm">Shares Left</span>
              </div>
            </div>

            {/* Storage Days */}
            <div className="transform rounded-2xl border border-white/20 bg-white/90 p-6 shadow-xl backdrop-blur-sm transition-all hover:scale-105">
              <div className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-pink-100">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-3xl font-bold text-purple-600">
                  {profile?.subscription_tier === 'premium' ? '∞' : getMinDaysLeft()}
                </span>
                <span className="text-muted-foreground mt-1 text-sm">Days Storage</span>
              </div>
            </div>

            {/* Subscription Tier */}
            <div className="transform rounded-2xl border border-white/20 bg-white/90 p-6 shadow-xl backdrop-blur-sm transition-all hover:scale-105">
              <div className="flex flex-col items-center text-center">
                <div className="from-brand-100 mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br to-orange-100">
                  <Crown className="text-brand-600 h-6 w-6" />
                </div>
                <span
                  className={`text-2xl font-bold ${profile?.subscription_tier === 'premium' ? 'text-yellow-600' : 'text-gray-600'}`}
                >
                  {profile?.subscription_tier === 'premium' ? 'PRO' : 'FREE'}
                </span>
                <span className="text-muted-foreground mt-1 text-sm">Your Plan</span>
              </div>
            </div>
          </div>

          {/* Free Tier Upgrade Banner */}
          {profile?.subscription_tier === 'free' && (
            <div className="from-brand-500 rounded-2xl bg-gradient-to-r to-orange-500 p-8 text-white shadow-xl">
              <div className="mb-6 text-center">
                <Crown className="mx-auto mb-4 h-12 w-12 text-yellow-300" />
                <h3 className="mb-2 text-2xl font-bold">Unlock Premium Features</h3>
                <p className="mx-auto mb-4 max-w-lg text-white/90">
                  Get unlimited storage, advanced nutrition insights, and premium features to
                  supercharge your food journey!
                </p>
                {/* Feature Comparison */}
                <div className="mx-auto mb-8 grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                    <h4 className="mb-3 font-semibold">Free Plan</h4>
                    <ul className="space-y-2 text-left text-sm">
                      <li className="flex items-center gap-2">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-xs">
                          ✓
                        </span>
                        <span>14-day meal storage</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-xs">
                          ✓
                        </span>
                        <span>3 monthly shares</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-xs">
                          ✓
                        </span>
                        <span>Basic nutrition info</span>
                      </li>
                    </ul>
                  </div>
                  <div className="rounded-xl border border-yellow-300/30 bg-yellow-500/20 p-4 backdrop-blur-sm">
                    <h4 className="mb-3 font-semibold">Premium Plan</h4>
                    <ul className="space-y-2 text-left text-sm">
                      <li className="flex items-center gap-2">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-yellow-300 text-xs text-yellow-800">
                          ✓
                        </span>
                        <span>Unlimited storage</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-yellow-300 text-xs text-yellow-800">
                          ✓
                        </span>
                        <span>Unlimited sharing</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-yellow-300 text-xs text-yellow-800">
                          ✓
                        </span>
                        <span>Advanced nutrition insights</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-yellow-300 text-xs text-yellow-800">
                          ✓
                        </span>
                        <span>6 insight modes</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mx-auto grid max-w-xl gap-4 sm:grid-cols-2">
                <Link
                  href="/upgrade"
                  className="text-brand-600 hover:bg-brand-50 group transform rounded-xl bg-white px-6 py-4 text-center font-semibold transition-all hover:scale-105"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span>Monthly</span>
                    <span className="font-bold">$4.99</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
                <Link
                  href="/upgrade"
                  className="group relative transform rounded-xl bg-purple-600 px-6 py-4 text-center font-semibold text-white transition-all hover:scale-105 hover:bg-purple-700"
                >
                  <div className="absolute -top-2 -right-2 rounded-full bg-green-500 px-2 py-1 text-xs text-white">
                    Save 17%
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span>Yearly</span>
                    <span className="font-bold">$49.99</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </div>
            </div>
          )}

          {/* Premium User Quick Actions */}
          {profile?.subscription_tier === 'premium' && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-full max-w-xl rounded-2xl border border-yellow-300/30 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 p-6 text-center backdrop-blur-sm">
                <Crown className="mx-auto mb-2 h-8 w-8 text-yellow-500" />
                <h3 className="mb-1 text-xl font-semibold text-yellow-700">
                  Premium Features Active
                </h3>
                <p className="text-sm text-yellow-700/80">
                  Enjoy unlimited storage, advanced insights, and premium features!
                </p>
              </div>
              <Link
                href="/camera"
                className="from-brand-600 inline-flex transform items-center gap-3 rounded-xl bg-gradient-to-r to-orange-600 px-6 py-3 text-lg font-semibold text-white transition-all hover:scale-105 hover:shadow-lg"
              >
                <Camera className="h-6 w-6" />
                Capture New Meal
              </Link>
            </div>
          )}
        </div>

        {/* Meals Grid */}
        {meals.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mb-4 text-6xl">🍽️</div>
            <h3 className="mb-2 text-xl font-semibold">Your food adventure awaits!</h3>
            <p className="text-muted-foreground mb-6">
              Start by capturing your first delicious meal 📸
            </p>
            <Link
              href="/camera"
              className="from-brand-600 inline-flex transform items-center gap-2 rounded-lg bg-gradient-to-r to-orange-600 px-6 py-3 text-white transition-all hover:scale-105 hover:shadow-lg"
            >
              <Camera className="h-4 w-4" />
              🚀 Start Your Journey
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {meals.map(meal => (
              <ErrorBoundary key={meal.id}>
                <MealCard
                  meal={meal}
                  profile={profile}
                  formatDate={formatDate}
                  getDaysLeft={getDaysLeft}
                />
              </ErrorBoundary>
            ))}
          </div>
        )}

        {/* Engagement Footer */}
        <div className="text-muted-foreground mt-8 text-center">
          <p className="text-sm">
            🎉 {meals.length} meals analyzed • Keep building your food story!
          </p>
        </div>
      </div>
    </div>
  )
}
