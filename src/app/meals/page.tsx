'use client'

import {
  AlertCircle,
  Calendar,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock,
  Crown,
  Flame,
  Heart,
  Share2,
  Star,
  Target,
  Trophy,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import React, { useCallback, useEffect, useState } from 'react'

import ErrorBoundary from '@/components/ErrorBoundary'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface IMeal {
  id: string
  created_at: string
  title: string | null
  description: string | null
  image_url: string
  image_path: string | null
  is_public: boolean
  ai_confidence_score: number | null
  processing_status: string
  scheduled_deletion_date: string | null
  view_count: number
  like_count: number
  basic_nutrition: {
    energy_kcal?: number
    protein_g?: number
    carbs_g?: number
    fat_g?: number
  } | null
  premium_nutrition: any
  health_score: number | null
  meal_tags: string[] | null
}

interface IDayMeals {
  date: string
  meals: IMeal[]
}

export default function UltimateMealsCalendar() {
  const { user, profile, loading: authLoading, hasActivePremium } = useAuth()
  const [activeTab, setActiveTab] = useState<'today' | 'week'>('today')
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)
  const [mealsData, setMealsData] = useState<IDayMeals[]>([])
  const [currentMealIndex, setCurrentMealIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCameraMotivation, setShowCameraMotivation] = useState(false)

  const isPremium = hasActivePremium()
  const selectedDate: string = new Date().toISOString().split('T')[0] || ''

  // Utility functions
  const formatTime = useCallback(
    (dateString: string) =>
      new Date(dateString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    []
  )

  const formatDate = useCallback(
    (dateString: string) =>
      new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    []
  )

  const formatFullDate = useCallback(
    (dateString: string) =>
      new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
    []
  )

  const isToday = useCallback(
    (dateString: string) => dateString === new Date().toISOString().split('T')[0],
    []
  )

  // Enhanced fetch function with error handling
  const fetchMeals = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (!user?.id) {
        throw new Error('User ID is missing. Please sign in again.')
      }

      // Get date range for last 7 days to populate calendar
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - 7)

      const { data: mealsData, error: mealsError } = await supabase
        .from('meals')
        .select(
          `
          id,
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
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (mealsError) {
        console.error('Meals fetch error:', mealsError)
        throw new Error(`Database error: ${mealsError.message}`)
      }

      // Group meals by date
      const groupedMeals: { [key: string]: IMeal[] } = {}

      if (mealsData) {
        mealsData.forEach((meal: IMeal) => {
          const mealDate = new Date(meal.created_at).toISOString().split('T')[0] || ''
          if (mealDate) {
            if (!groupedMeals[mealDate]) {
              groupedMeals[mealDate] = []
            }
            groupedMeals[mealDate].push(meal)
          }
        })
      }

      // Convert to array format and ensure we have entries for last 7 days
      const dayMealsArray: IDayMeals[] = []
      for (let i = 0; i < 7; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateString = date.toISOString().split('T')[0]

        const safeDateString = dateString || ''

        dayMealsArray.push({
          date: safeDateString,
          meals: groupedMeals[safeDateString] || [],
        })
      }

      setMealsData(dayMealsArray)
    } catch (err) {
      console.error('🚨 Error in fetchMeals:', err)
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(`😅 Oops! ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchMeals()
      } else {
        console.log('⚠️ No authenticated user, redirecting to login')
        window.location.href = '/login'
      }
    }
  }, [user, authLoading, fetchMeals])

  const getCurrentDayMeals = useCallback(
    () => mealsData.find(day => day.date === selectedDate)?.meals || [],
    [mealsData, selectedDate]
  )

  const getWeekDays = useCallback(() => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + currentWeekOffset * 7)

    const weekDays = []
    const maxDays = currentWeekOffset === 0 ? today.getDay() + 1 : 7 // Current week: Sunday through today only, Past weeks: all 7 days

    for (let i = 0; i < maxDays; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      const dateString = day.toISOString().split('T')[0]
      const safeDayDate = dateString || ''

      const dayMeals = mealsData.find(d => d.date === safeDayDate)?.meals || []

      weekDays.push({
        date: safeDayDate,
        meals: dayMeals,
        isToday: isToday(safeDayDate),
      })
    }

    // Reverse days order: show most recent days first (TODAY → Yesterday → etc.)
    // Current week: TODAY → Yesterday → Day Before → Sunday
    // Past weeks: Saturday → Friday → Thursday → Wednesday → Tuesday → Monday → Sunday
    return weekDays.reverse()
  }, [mealsData, currentWeekOffset, isToday])

  const currentMeals = getCurrentDayMeals()
  const currentMeal = currentMeals[currentMealIndex]
  const weekDays = getWeekDays()

  const handlePrevMeal = () => {
    setCurrentMealIndex(prev => (prev > 0 ? prev - 1 : currentMeals.length - 1))
  }

  const handleNextMeal = () => {
    setCurrentMealIndex(prev => (prev < currentMeals.length - 1 ? prev + 1 : 0))
  }

  const handleWeekNavigation = (direction: 'prev' | 'next') => {
    setCurrentWeekOffset(prev => (direction === 'next' ? prev + 1 : prev - 1))
  }

  const getTotalDayCalories = () =>
    currentMeals.reduce((total, meal) => total + (meal.basic_nutrition?.energy_kcal || 0), 0)

  // PSYCHOLOGICAL MESSAGING FUNCTIONS
  const getEmptyDayMessage = (dateString: string) => {
    const isCurrentDay = isToday(dateString)

    if (isCurrentDay) {
      return {
        icon: <Camera className="h-8 w-8 text-purple-500" />,
        title: '🍽️ Meal opportunity awaits!',
        subtitle: 'Your food journey starts with one photo',
        cta: '📸 Capture Your First Meal',
        gradient: 'from-purple-500 to-pink-500',
      }
    } else {
      return {
        icon: <AlertCircle className="h-8 w-8 text-red-500" />,
        title: `🚨 Missed food memories from ${formatDate(dateString)}!`,
        subtitle: '😢 Your amazing meals are lost forever...',
        cta: '⏰ Don&apos;t let today&apos;s meals disappear too!',
        gradient: 'from-red-500 to-orange-500',
      }
    }
  }

  const getCameraMotivationMessage = () => {
    const messages = [
      {
        icon: <Trophy className="h-6 w-6" />,
        text: '🏆 Ready to level up your food game?',
        gradient: 'from-yellow-400 to-orange-500',
      },
      {
        icon: <Zap className="h-6 w-6" />,
        text: '⚡ Snap → Analyze → Amaze yourself!',
        gradient: 'from-blue-400 to-purple-500',
      },
      {
        icon: <Target className="h-6 w-6" />,
        text: '🎯 Every meal is a discovery waiting to happen!',
        gradient: 'from-green-400 to-blue-500',
      },
    ]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-purple-600"></div>
          <p className="font-semibold text-purple-600">Loading your food journey...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-orange-100 p-4">
        <div className="container mx-auto max-w-4xl">
          <ErrorBoundary>
            <div className="py-20 text-center">
              <p className="mb-4 text-red-600">{error}</p>
              <button
                onClick={fetchMeals}
                className="transform rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-white transition-all hover:scale-105 hover:from-purple-700 hover:to-pink-700"
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
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
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
              Hey {profile?.full_name?.split(' ')[0] || 'there'}, here&apos;s your food journey! 🌟
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isPremium && <Crown style={{ width: '24px', height: '24px', color: '#eab308' }} />}
              <Flame style={{ width: '28px', height: '28px', color: '#ea580c' }} />
            </div>
          </div>

          {/* Tab Navigation */}
          <div
            style={{
              display: 'flex',
              gap: '8px',
              borderRadius: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              padding: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
            }}
          >
            <button
              onClick={() => setActiveTab('today')}
              style={{
                flex: 1,
                borderRadius: '12px',
                padding: '16px 24px',
                fontWeight: '600',
                fontSize: '16px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background:
                  activeTab === 'today'
                    ? 'linear-gradient(to right, #10b981, #ea580c)'
                    : 'transparent',
                color: activeTab === 'today' ? 'white' : '#6b7280',
                boxShadow: activeTab === 'today' ? '0 8px 15px rgba(16, 185, 129, 0.3)' : 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Star style={{ width: '20px', height: '20px' }} />
                <span>Today</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('week')}
              style={{
                flex: 1,
                borderRadius: '12px',
                padding: '16px 24px',
                fontWeight: '600',
                fontSize: '16px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background:
                  activeTab === 'week'
                    ? 'linear-gradient(to right, #10b981, #ea580c)'
                    : 'transparent',
                color: activeTab === 'week' ? 'white' : '#6b7280',
                boxShadow: activeTab === 'week' ? '0 8px 15px rgba(16, 185, 129, 0.3)' : 'none',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Calendar style={{ width: '20px', height: '20px' }} />
                <span>This Week</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '32px 24px',
        }}
      >

        {/* TODAY SECTION - Show only when activeTab is 'today' */}
        {activeTab === 'today' && (
          <div style={{ marginBottom: '48px' }}>
            <div
              style={{
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    margin: 0,
                  }}
                >
                  {formatFullDate(selectedDate)}
                </h2>
                <p
                  style={{
                    fontSize: '16px',
                    color: '#6b7280',
                    margin: '8px 0 0 0',
                  }}
                >
                  {currentMeals.length} meals • {getTotalDayCalories()} calories
                </p>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'linear-gradient(to right, #10b981, #ea580c)',
                  boxShadow: '0 8px 15px rgba(16, 185, 129, 0.3)',
                }}
              >
                <Heart style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
            </div>

            {/* Current Day Meals */}
            {currentMeals.length === 0 ? (
              <div>
                {(() => {
                  const emptyMsg = getEmptyDayMessage(selectedDate)
                  return (
                    <div
                      style={{
                        borderRadius: '24px',
                        background: isToday(selectedDate)
                          ? 'linear-gradient(to right, #10b981, #ea580c)'
                          : 'linear-gradient(to right, #dc2626, #ea580c)',
                        padding: '48px 32px',
                        textAlign: 'center',
                        color: 'white',
                        boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: 'rgba(0, 0, 0, 0.1)',
                        }}
                      ></div>
                      <div style={{ position: 'relative', zIndex: 10 }}>
                        <div
                          style={{
                            width: '80px',
                            height: '80px',
                            margin: '0 auto 24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            backdropFilter: 'blur(8px)',
                          }}
                        >
                          {emptyMsg.icon}
                        </div>
                        <h3
                          style={{
                            fontSize: '24px',
                            fontWeight: 'bold',
                            marginBottom: '12px',
                            margin: 0,
                          }}
                        >
                          {emptyMsg.title}
                        </h3>
                        <p
                          style={{
                            fontSize: '18px',
                            opacity: 0.9,
                            marginBottom: '32px',
                            maxWidth: '400px',
                            margin: '12px auto 32px',
                          }}
                        >
                          {emptyMsg.subtitle}
                        </p>
                        <Link href="/camera">
                          <button
                            onClick={() => setShowCameraMotivation(!showCameraMotivation)}
                            style={{
                              borderRadius: '16px',
                              border: '2px solid rgba(255, 255, 255, 0.3)',
                              backgroundColor: 'rgba(255, 255, 255, 0.2)',
                              padding: '16px 32px',
                              fontSize: '18px',
                              fontWeight: 'bold',
                              color: 'white',
                              boxShadow: '0 8px 15px rgba(0, 0, 0, 0.2)',
                              backdropFilter: 'blur(8px)',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                            }}
                          >
                            {emptyMsg.cta}
                          </button>
                        </Link>

                        {/* Camera Motivation Popup */}
                        {showCameraMotivation &&
                          (() => {
                            const motivation = getCameraMotivationMessage()
                            return (
                              <div
                                style={{
                                  marginTop: '24px',
                                  borderRadius: '16px',
                                  border: '2px solid rgba(255, 255, 255, 0.3)',
                                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                  padding: '20px',
                                  backdropFilter: 'blur(8px)',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px',
                                  }}
                                >
                                  <div
                                    style={{
                                      background: motivation?.gradient
                                        ? `linear-gradient(to right, ${motivation.gradient.split(' ')[1]}, ${motivation.gradient.split(' ')[3]})`
                                        : 'linear-gradient(to right, #10b981, #ea580c)',
                                      borderRadius: '50%',
                                      padding: '12px',
                                    }}
                                  >
                                    {motivation?.icon}
                                  </div>
                                  <span
                                    style={{
                                      fontWeight: '600',
                                      fontSize: '16px',
                                    }}
                                  >
                                    {motivation?.text}
                                  </span>
                                </div>
                              </div>
                            )
                          })()}
                      </div>
                    </div>
                  )
                })()}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Main Meal Card */}
                <div className="relative overflow-hidden rounded-3xl bg-white/90 shadow-xl backdrop-blur-sm">
                  {currentMeals.length > 1 && (
                    <div className="absolute top-4 right-4 z-10 rounded-full bg-black/20 px-3 py-1 backdrop-blur-sm">
                      <span className="text-sm font-medium text-white">
                        {currentMealIndex + 1} of {currentMeals.length}
                      </span>
                    </div>
                  )}

                  {/* Meal Image */}
                  <div className="relative h-80 bg-gradient-to-br from-gray-100 to-gray-200">
                    <img
                      src={currentMeal?.image_url}
                      alt={currentMeal?.title || 'Delicious Meal'}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                    {/* Time Stamp with Pulse Effect */}
                    <div className="absolute bottom-4 left-4 flex items-center space-x-2 text-white">
                      <div className="animate-pulse">
                        <Clock className="h-4 w-4" />
                      </div>
                      <span className="font-medium">
                        {currentMeal?.created_at ? formatTime(currentMeal.created_at) : 'N/A'}
                      </span>
                    </div>

                    {/* Achievement Badge */}
                    <div className="absolute top-4 left-4 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 px-3 py-1">
                      <div className="flex items-center space-x-1">
                        <Trophy className="h-3 w-3 text-white" />
                        <span className="text-xs font-bold text-white">ANALYZED!</span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Meal Info */}
                  <div className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-800">
                        {currentMeal?.title || 'Delicious Meal'}
                      </h3>
                      <div className="flex items-center space-x-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 px-3 py-1">
                        <Flame className="h-4 w-4 text-orange-500" />
                        <span className="font-bold text-purple-600">
                          {currentMeal?.basic_nutrition?.energy_kcal || 0} cal
                        </span>
                      </div>
                    </div>

                    {/* Enhanced Nutrition Bars */}
                    <div className="mb-4 grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="mb-1 text-sm font-semibold text-gray-600">Protein</div>
                        <div className="mb-1 h-3 overflow-hidden rounded-full bg-green-100">
                          <div
                            className="h-3 rounded-full bg-gradient-to-r from-green-400 to-green-600 shadow-inner transition-all duration-1000"
                            style={{
                              width: `${Math.min((currentMeal?.basic_nutrition?.protein_g || 0) * 2, 100)}%`,
                            }}
                          />
                        </div>
                        <div className="text-xs font-bold text-green-600">
                          {currentMeal?.basic_nutrition?.protein_g || 0}g
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="mb-1 text-sm font-semibold text-gray-600">Carbs</div>
                        <div className="mb-1 h-3 overflow-hidden rounded-full bg-blue-100">
                          <div
                            className="h-3 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 shadow-inner transition-all duration-1000"
                            style={{
                              width: `${Math.min((currentMeal?.basic_nutrition?.carbs_g || 0) * 1.5, 100)}%`,
                            }}
                          />
                        </div>
                        <div className="text-xs font-bold text-blue-600">
                          {currentMeal?.basic_nutrition?.carbs_g || 0}g
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="mb-1 text-sm font-semibold text-gray-600">Fat</div>
                        <div className="mb-1 h-3 overflow-hidden rounded-full bg-orange-100">
                          <div
                            className="h-3 rounded-full bg-gradient-to-r from-orange-400 to-orange-600 shadow-inner transition-all duration-1000"
                            style={{
                              width: `${Math.min((currentMeal?.basic_nutrition?.fat_g || 0) * 3, 100)}%`,
                            }}
                          />
                        </div>
                        <div className="text-xs font-bold text-orange-600">
                          {currentMeal?.basic_nutrition?.fat_g || 0}g
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Actions */}
                    <div className="flex space-x-3">
                      <button className="flex flex-1 items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-purple-100 to-pink-100 py-3 font-semibold text-purple-700 transition-all hover:shadow-md">
                        <Share2 className="h-4 w-4" />
                        <span>Share Victory</span>
                      </button>
                      <button className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white transition-all hover:shadow-lg">
                        🔍 Deep Dive
                      </button>
                    </div>
                  </div>
                </div>

                {/* Horizontal Navigation for Today's Meals */}
                {currentMeals.length > 1 && (
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      onClick={handlePrevMeal}
                      className="rounded-full bg-white/80 p-3 shadow-lg transition-all hover:scale-110 hover:bg-white"
                      title="Previous Meal"
                    >
                      <ChevronLeft className="h-5 w-5 text-purple-600" />
                    </button>

                    <div className="flex space-x-2">
                      {currentMeals.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentMealIndex(index)}
                          className={`h-3 w-3 rounded-full transition-all ${
                            index === currentMealIndex
                              ? 'scale-110 bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg'
                              : 'bg-white/60 hover:bg-white/80'
                          }`}
                          title={`Meal ${index + 1}`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={handleNextMeal}
                      className="rounded-full bg-white/80 p-3 shadow-lg transition-all hover:scale-110 hover:bg-white"
                      title="Next Meal"
                    >
                      <ChevronRight className="h-5 w-5 text-purple-600" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* WEEK VIEW - Only show if "This Week" tab is active */}
        {activeTab === 'week' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Week Navigation */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '24px',
              }}
            >
              <button
                onClick={() => handleWeekNavigation('prev')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  borderRadius: '16px',
                  background: 'linear-gradient(to right, #10b981, #ea580c)',
                  padding: '16px 24px',
                  boxShadow: '0 8px 15px rgba(16, 185, 129, 0.3)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '16px',
                }}
              >
                <ChevronLeft style={{ width: '20px', height: '20px' }} />
                <span>Previous Week</span>
              </button>

              <div style={{ textAlign: 'center' }}>
                <h3
                  style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    margin: 0,
                  }}
                >
                  {currentWeekOffset === 0
                    ? 'Current Week'
                    : currentWeekOffset === -1
                      ? '1 Week Ago'
                      : `${Math.abs(currentWeekOffset)} Weeks Ago`}
                </h3>
              </div>

              {/* Only show Next Week button when viewing past weeks */}
              {currentWeekOffset < 0 ? (
                <button
                  onClick={() => handleWeekNavigation('next')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    borderRadius: '16px',
                    background: 'linear-gradient(to right, #10b981, #ea580c)',
                    padding: '16px 24px',
                    boxShadow: '0 8px 15px rgba(16, 185, 129, 0.3)',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '16px',
                  }}
                >
                  <span>Next Week</span>
                  <ChevronRight style={{ width: '20px', height: '20px' }} />
                </button>
              ) : (
                /* Invisible spacer to maintain layout balance */
                <div style={{ width: '140px' }}></div>
              )}
            </div>

            {/* Week Days */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {weekDays.map(day => (
                <div
                  key={day.date}
                  style={{
                    borderRadius: '24px',
                    background: 'rgba(255, 255, 255, 0.9)',
                    boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
                    backdropFilter: 'blur(12px)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Day Header */}
                  <div
                    style={{
                      background: day.isToday
                        ? 'linear-gradient(to right, #10b981, #ea580c)'
                        : 'linear-gradient(to right, #f3f4f6, #e5e7eb)',
                      padding: '20px 24px',
                      color: day.isToday ? 'white' : '#1f2937',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                          }}
                        >
                          {formatDate(day.date)}
                        </span>
                        {day.isToday && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              borderRadius: '50px',
                              backgroundColor: 'rgba(255, 255, 255, 0.2)',
                              padding: '8px 16px',
                              backdropFilter: 'blur(8px)',
                            }}
                          >
                            <Star style={{ width: '16px', height: '16px' }} />
                            <span
                              style={{
                                fontSize: '12px',
                                fontWeight: '600',
                              }}
                            >
                              TODAY
                            </span>
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          opacity: day.isToday ? 0.9 : 0.8,
                        }}
                      >
                        {day.meals.length} meal{day.meals.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Day Meals */}
                  <div style={{ padding: '24px' }}>
                    {day.meals.length === 0 ? (
                      (() => {
                        const emptyMsg = getEmptyDayMessage(day.date)
                        return (
                          <div
                            style={{
                              borderRadius: '16px',
                              background: day.isToday
                                ? 'linear-gradient(to right, #10b981, #ea580c)'
                                : 'linear-gradient(to right, #dc2626, #ea580c)',
                              padding: '32px 24px',
                              textAlign: 'center',
                              color: 'white',
                              boxShadow: '0 8px 15px rgba(0, 0, 0, 0.2)',
                            }}
                          >
                            <div
                              style={{
                                width: '48px',
                                height: '48px',
                                margin: '0 auto 16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(8px)',
                              }}
                            >
                              {React.cloneElement(emptyMsg.icon, {
                                style: { width: '24px', height: '24px' },
                              })}
                            </div>
                            <h4
                              style={{
                                fontSize: '16px',
                                fontWeight: 'bold',
                                marginBottom: '8px',
                                margin: 0,
                              }}
                            >
                              {emptyMsg.title}
                            </h4>
                            <p
                              style={{
                                fontSize: '12px',
                                opacity: 0.9,
                                margin: '8px 0 0 0',
                              }}
                            >
                              {emptyMsg.subtitle}
                            </p>
                          </div>
                        )
                      })()
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          gap: '16px',
                          overflowX: 'auto',
                          paddingBottom: '8px',
                        }}
                      >
                        {day.meals.map(meal => (
                          <div
                            key={meal.id}
                            style={{
                              width: '160px',
                              flexShrink: 0,
                              borderRadius: '16px',
                              backgroundColor: 'white',
                              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                            }}
                          >
                            <div
                              style={{
                                position: 'relative',
                                height: '96px',
                                background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
                              }}
                            >
                              <img
                                src={meal.image_url}
                                alt={meal.title || 'Delicious Meal'}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '8px',
                                  right: '8px',
                                  borderRadius: '8px',
                                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                  padding: '4px 8px',
                                  backdropFilter: 'blur(4px)',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontWeight: '500',
                                    color: 'white',
                                  }}
                                >
                                  {formatTime(meal.created_at)}
                                </span>
                              </div>
                            </div>
                            <div style={{ padding: '12px' }}>
                              <h5
                                style={{
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  color: '#1f2937',
                                  marginBottom: '8px',
                                  margin: 0,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {meal.title || 'Delicious Meal'}
                              </h5>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  fontSize: '10px',
                                }}
                              >
                                <span
                                  style={{
                                    fontWeight: 'bold',
                                    background: 'linear-gradient(to right, #10b981, #ea580c)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                  }}
                                >
                                  {meal.basic_nutrition?.energy_kcal || 0} cal
                                </span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <div
                                    style={{
                                      width: '4px',
                                      height: '12px',
                                      borderRadius: '2px',
                                      backgroundColor: '#22c55e',
                                    }}
                                  ></div>
                                  <div
                                    style={{
                                      width: '4px',
                                      height: '12px',
                                      borderRadius: '2px',
                                      backgroundColor: '#3b82f6',
                                    }}
                                  ></div>
                                  <div
                                    style={{
                                      width: '4px',
                                      height: '12px',
                                      borderRadius: '2px',
                                      backgroundColor: '#ea580c',
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Upgrade Prompt */}
        {!isPremium && (
          <div
            style={{
              marginTop: '48px',
              borderRadius: '24px',
              background: 'linear-gradient(to right, #10b981, #ea580c)',
              padding: '48px 32px',
              color: 'white',
              boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
              }}
            ></div>
            <div
              style={{
                position: 'relative',
                zIndex: 10,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  marginBottom: '24px',
                  animation: 'bounce 1s infinite',
                }}
              >
                <Crown
                  style={{
                    width: '48px',
                    height: '48px',
                    color: '#fde68a',
                    margin: '0 auto',
                  }}
                />
              </div>
              <h3
                style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  marginBottom: '16px',
                  margin: 0,
                }}
              >
                🚀 Supercharge Your Food Journey!
              </h3>
              <p
                style={{
                  fontSize: '18px',
                  opacity: 0.9,
                  marginBottom: '32px',
                  maxWidth: '500px',
                  margin: '16px auto 32px',
                }}
              >
                Unlock unlimited storage, AI insights, and exclusive features that make every meal
                extraordinary!
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  marginBottom: '24px',
                }}
              >
                <Link href="/upgrade">
                  <button
                    style={{
                      width: '100%',
                      borderRadius: '16px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      padding: '20px 16px',
                      fontWeight: 'bold',
                      color: 'white',
                      backdropFilter: 'blur(8px)',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      fontSize: '16px',
                    }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>$4.99</div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>per month</div>
                  </button>
                </Link>
                <Link href="/upgrade">
                  <button
                    style={{
                      width: '100%',
                      borderRadius: '16px',
                      background: 'linear-gradient(to right, #fbbf24, #ea580c)',
                      padding: '20px 16px',
                      fontWeight: 'bold',
                      color: '#7c2d12',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      border: 'none',
                      fontSize: '16px',
                      boxShadow: '0 8px 15px rgba(251, 191, 36, 0.3)',
                    }}
                  >
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>$49.99</div>
                    <div style={{ fontSize: '14px' }}>per year • Save 17%! 🎉</div>
                  </button>
                </Link>
              </div>
              <div
                style={{
                  fontSize: '14px',
                  opacity: 0.8,
                }}
              >
                ⚡ Instant access • 🔄 Cancel anytime • 💪 Join thousands of food adventurers!
              </div>
            </div>
          </div>
        )}

        {/* Quick Action Button */}
        <div
          style={{
            position: 'fixed',
            right: '24px',
            bottom: '24px',
            zIndex: 50,
          }}
        >
          <Link href="/camera">
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(to right, #10b981, #ea580c)',
                color: 'white',
                boxShadow: '0 20px 25px rgba(16, 185, 129, 0.4)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                animation: 'pulse 2s infinite',
                backdropFilter: 'blur(8px)',
              }}
              title="Capture New Meal"
            >
              <Camera style={{ width: '28px', height: '28px' }} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
