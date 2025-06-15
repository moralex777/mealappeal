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
  Plus,
  Star,
  Target,
  Trophy,
} from 'lucide-react'
import Link from 'next/link'
import React, { useCallback, useEffect, useRef, useState } from 'react'

import SmartAnalysisModes from '@/components/SmartAnalysisModes'
import ConversionTrigger, { useConversionTriggers } from '@/components/ConversionTriggers'
import ErrorBoundary from '@/components/ErrorBoundary'
import PremiumTestingPanel from '@/components/PremiumTestingPanel'
import { AppLayout } from '@/components/AppLayout'
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
  canBrowse: boolean
  isRegistrationDate?: boolean
}

interface LazyImageProps {
  src: string
  alt: string
  style?: React.CSSProperties
  onLoad?: () => void
}

const LazyImage: React.FC<LazyImageProps> = ({ src, alt, style, onLoad }) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  return (
    <div ref={imgRef} style={style}>
      {isInView && (
        <>
          {/* Blur placeholder */}
          {!isLoaded && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                filter: 'blur(10px)',
                background: 'linear-gradient(45deg, #f3f4f6, #e5e7eb, #d1d5db)',
                animation: 'pulse 2s infinite',
              }}
            />
          )}
          
          {/* Actual image */}
          <img
            src={src}
            alt={alt}
            onLoad={handleLoad}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              transition: 'opacity 0.5s ease',
              opacity: isLoaded ? 1 : 0
            }}
          />
        </>
      )}
    </div>
  )
}

export default function SmartMealsCalendar() {
  const { user, profile, loading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<'today' | 'week'>('today')
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)
  const [mealsData, setMealsData] = useState<IDayMeals[]>([])
  const [currentMealIndex, setCurrentMealIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFirstTimeMessage, setShowFirstTimeMessage] = useState(false)
  const [registrationDate, setRegistrationDate] = useState<string | null>(null)
  const [, setHasAnyMeals] = useState(false)
  const [showTestingPanel, setShowTestingPanel] = useState(false)
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false)
  
  const { triggers, addTrigger, removeTrigger } = useConversionTriggers()

  const isPremium = profile?.subscription_tier === 'premium_monthly' || profile?.subscription_tier === 'premium_yearly'
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

  const canBrowseDate = useCallback(
    (date: string) => {
      if (!registrationDate) return true
      
      const dateObj = new Date(date)
      const regDateString = registrationDate?.split('T')[0] || ''
      const regDate = new Date(regDateString || '1900-01-01')
      
      return dateObj >= regDate
    },
    [registrationDate]
  )

  // Enhanced fetch function with smart boundaries
  const fetchMeals = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (!user?.id || !profile) {
        throw new Error('User information is missing. Please sign in again.')
      }

      // Get user registration date for browsing limits
      const userRegistrationDate = profile.created_at
      setRegistrationDate(userRegistrationDate)

      // First, check if user has any meals at all
      const { count: totalMealsCount, error: countError } = await supabase
        .from('meals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      if (countError) {
        console.error('Error counting meals:', countError)
      }

      const hasMeals = (totalMealsCount || 0) > 0
      setHasAnyMeals(hasMeals)
      setShowFirstTimeMessage(!hasMeals)

      // Get date range - smart boundaries based on registration
      const endDate = new Date()
      const regDateString = userRegistrationDate?.split('T')[0] || ''
      const startDate = regDateString ? new Date(regDateString) : endDate
      
      // If user is new (registered today), only show today
      // Otherwise show last 7 days or since registration, whichever is shorter
      const daysToShow = isToday(regDateString || '') ? 1 : 7
      const calculatedStartDate = new Date()
      calculatedStartDate.setDate(endDate.getDate() - (daysToShow - 1))
      
      const effectiveStartDate = calculatedStartDate > startDate ? calculatedStartDate : startDate

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
        .gte('created_at', effectiveStartDate.toISOString())
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

      // Create smart day entries with browsing permissions
      const dayMealsArray: IDayMeals[] = []
      for (let i = 0; i < daysToShow; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateString = date.toISOString().split('T')[0]
        const safeDateString = dateString || ''

        const canBrowse = canBrowseDate(safeDateString)
        const isRegDate = safeDateString === regDateString

        dayMealsArray.push({
          date: safeDateString,
          meals: groupedMeals[safeDateString] || [],
          canBrowse,
          isRegistrationDate: isRegDate,
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
  }, [user?.id, profile, canBrowseDate, isToday])

  useEffect(() => {
    if (!authLoading) {
      if (user && profile) {
        fetchMeals()
      } else {
        console.log('⚠️ No authenticated user, redirecting to login')
        window.location.href = '/login'
      }
    }
  }, [user, profile, authLoading, fetchMeals])

  const getCurrentDayMeals = useCallback(
    () => mealsData.find(day => day.date === selectedDate)?.meals || [],
    [mealsData, selectedDate]
  )

  const getWeekDays = useCallback(() => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + currentWeekOffset * 7)

    const weekDays = []
    const maxDays = currentWeekOffset === 0 ? today.getDay() + 1 : 7

    for (let i = 0; i < maxDays; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      const dateString = day.toISOString().split('T')[0]
      const safeDayDate = dateString || ''

      const dayMeals = mealsData.find(d => d.date === safeDayDate)?.meals || []
      const canBrowse = canBrowseDate(safeDayDate)

      weekDays.push({
        date: safeDayDate,
        meals: dayMeals,
        isToday: isToday(safeDayDate),
        canBrowse,
      })
    }

    return weekDays.reverse()
  }, [mealsData, currentWeekOffset, isToday, canBrowseDate])

  const currentMeals = getCurrentDayMeals()
  const currentMeal = currentMeals[currentMealIndex]
  const weekDays = getWeekDays()

  // Add conversion triggers when users interact with premium features
  const handlePremiumFeatureClick = (featureName: string) => {
    if (!isPremium) {
      addTrigger('feature_limit', { featureName })
    }
  }

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

  // Enhanced messaging system
  const getFirstTimeMessage = () => ({
    icon: <Camera style={{ width: '48px', height: '48px', color: '#16a34a' }} />,
    title: '🌟 Welcome to your food journey!',
    subtitle: 'Take your first meal photo to unlock your personalized nutrition insights',
    cta: '📸 Capture Your First Meal',
    subtext: 'Every great journey starts with a single photo ✨',
  })

  const getEmptyDayMessage = (dateString: string, canBrowse: boolean) => {
    if (!canBrowse) {
      return {
        icon: <Calendar style={{ width: '32px', height: '32px', color: '#9ca3af' }} />,
        title: 'Join date',
        subtitle: `Your journey started ${formatDate(registrationDate?.split('T')[0] || '')}`,
        cta: '',
      }
    }

    const isCurrentDay = isToday(dateString)
    const dayOfWeek = new Date(dateString).toLocaleDateString('en-US', { weekday: 'long' })

    if (isCurrentDay) {
      return {
        icon: <Plus style={{ width: '32px', height: '32px', color: '#16a34a' }} />,
        title: '🍽️ Ready for today\'s food adventure?',
        subtitle: 'Capture what you\'re eating and discover amazing insights!',
        cta: '📸 Add Today\'s Meal',
      }
    } else {
      const isFuture = new Date(dateString) > new Date()
      
      if (isFuture) {
        return {
          icon: <Target style={{ width: '32px', height: '32px', color: '#a855f7' }} />,
          title: `🔮 ${dayOfWeek} meal planning`,
          subtitle: 'Imagine the delicious possibilities ahead!',
          cta: '',
        }
      } else {
        return {
          icon: <AlertCircle style={{ width: '32px', height: '32px', color: '#f59e0b' }} />,
          title: `📅 ${formatDate(dateString)} memories`,
          subtitle: 'This day could have been captured for your journey',
          cta: '⏰ Don\'t miss today\'s meals!',
        }
      }
    }
  }

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'linear-gradient(135deg, #f9fafb 0%, #f3e8ff 25%, #fce7f3 50%, #fff7ed 75%, #f0fdf4 100%)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              margin: '0 auto 16px',
              borderRadius: '50%',
              border: '2px solid #9333ea',
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
            }}
          />
          <p style={{ fontWeight: '600', color: '#9333ea' }}>Loading your food journey...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background:
            'linear-gradient(135deg, #f9fafb 0%, #f3e8ff 25%, #fce7f3 50%, #fff7ed 75%, #f0fdf4 100%)',
          padding: '16px',
        }}
      >
        <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
          <ErrorBoundary>
            <div style={{ padding: '80px 0', textAlign: 'center' }}>
              <p style={{ marginBottom: '16px', color: '#dc2626' }}>{error}</p>
              <button
                onClick={fetchMeals}
                style={{
                  transform: 'none',
                  borderRadius: '8px',
                  background: 'linear-gradient(to right, #9333ea, #ec4899)',
                  padding: '12px 24px',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
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
    <AppLayout>
      <div
        style={{
          minHeight: '100vh',
          background:
            'linear-gradient(135deg, #f9fafb 0%, #f3e8ff 25%, #fce7f3 50%, #fff7ed 75%, #f0fdf4 100%)',
          fontFamily: 'Inter, sans-serif',
          paddingBottom: '100px', // Space for bottom navigation
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
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
          <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 'bold',
                background: 'linear-gradient(to right, #10b981, #ea580c)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                margin: 0,
              }}
            >
              {showFirstTimeMessage 
                ? `Welcome, ${profile?.full_name?.split(' ')[0] || 'Food Explorer'}! 🌟`
                : `Hey ${profile?.full_name?.split(' ')[0] || 'there'}, here's your food journey! 🌟`
              }
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isPremium && <Crown style={{ width: '24px', height: '24px', color: '#eab308' }} />}
              <Flame style={{ width: '28px', height: '28px', color: '#ea580c' }} />
            </div>
          </div>

          {/* Tab Navigation */}
          <div
            style={{
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
              padding: '8px',
            }}
          >
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setActiveTab('today')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderRadius: '12px',
                  padding: '16px 24px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: activeTab === 'today' 
                    ? 'linear-gradient(to right, #10b981, #ea580c)'
                    : 'transparent',
                  color: activeTab === 'today' ? 'white' : '#6b7280',
                  boxShadow: activeTab === 'today' ? '0 8px 25px rgba(16, 185, 129, 0.3)' : 'none',
                }}
                onMouseEnter={e => {
                  if (activeTab !== 'today') {
                    e.currentTarget.style.backgroundColor = '#f9fafb'
                  }
                }}
                onMouseLeave={e => {
                  if (activeTab !== 'today') {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <Star style={{ width: '20px', height: '20px' }} />
                <span>Today</span>
              </button>
              <button
                onClick={() => setActiveTab('week')}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  borderRadius: '12px',
                  padding: '16px 24px',
                  fontWeight: '600',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: activeTab === 'week' 
                    ? 'linear-gradient(to right, #10b981, #ea580c)'
                    : 'transparent',
                  color: activeTab === 'week' ? 'white' : '#6b7280',
                  boxShadow: activeTab === 'week' ? '0 8px 25px rgba(16, 185, 129, 0.3)' : 'none',
                }}
                onMouseEnter={e => {
                  if (activeTab !== 'week') {
                    e.currentTarget.style.backgroundColor = '#f9fafb'
                  }
                }}
                onMouseLeave={e => {
                  if (activeTab !== 'week') {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                <Calendar style={{ width: '20px', height: '20px' }} />
                <span>This Week</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* First Time User Experience */}
        {showFirstTimeMessage && (
          <div style={{ marginBottom: '32px' }}>
            {(() => {
              const firstTimeMsg = getFirstTimeMessage()
              return (
                <div
                  style={{
                    borderRadius: '24px',
                    background: 'linear-gradient(to right, #16a34a, #22c55e)',
                    overflow: 'hidden',
                    padding: '32px',
                    textAlign: 'center',
                    color: 'white',
                    boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
                  }}
                >
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
                      backdropFilter: 'blur(12px)',
                    }}
                  >
                    {firstTimeMsg.icon}
                  </div>
                  <h2 style={{ marginBottom: '16px', fontSize: '32px', fontWeight: 'bold' }}>{firstTimeMsg.title}</h2>
                  <p style={{ marginBottom: '24px', fontSize: '18px', opacity: 0.9 }}>{firstTimeMsg.subtitle}</p>
                  <Link href="/camera">
                    <button
                      style={{
                        borderRadius: '16px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        backdropFilter: 'blur(12px)',
                        padding: '16px 32px',
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'scale(1.05)'
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                      }}
                    >
                      {firstTimeMsg.cta}
                    </button>
                  </Link>
                  <p style={{ marginTop: '16px', fontSize: '14px', opacity: 0.75 }}>{firstTimeMsg.subtext}</p>
                </div>
              )
            })()}
          </div>
        )}

        {/* TODAY SECTION */}
        {activeTab === 'today' && (
          <div style={{ marginBottom: '48px' }}>
            <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>{formatFullDate(selectedDate)}</h2>
                <p style={{ color: '#6b7280', margin: 0 }}>
                  {currentMeals.length} meals • {getTotalDayCalories()} calories
                </p>
              </div>
              <div
                style={{
                  background: 'linear-gradient(to right, #10b981, #ea580c)',
                  display: 'flex',
                  width: '56px',
                  height: '56px',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
                }}
              >
                <Heart style={{ width: '24px', height: '24px', color: 'white' }} />
              </div>
            </div>

            {/* Current Day Meals */}
            {currentMeals.length === 0 ? (
              <div>
                {(() => {
                  const canBrowse = mealsData.find(day => day.date === selectedDate)?.canBrowse ?? true
                  const emptyMsg = getEmptyDayMessage(selectedDate, canBrowse)
                  
                  return (
                    <div
                      style={{
                        borderRadius: '24px',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(12px)',
                        overflow: 'hidden',
                        padding: '32px',
                        textAlign: 'center',
                        color: 'white',
                        boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
                        backgroundImage: canBrowse 
                          ? 'linear-gradient(to right, #16a34a, #22c55e)'
                          : 'linear-gradient(to right, #6b7280, #4b5563)',
                      }}
                    >
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
                          backdropFilter: 'blur(12px)',
                        }}
                      >
                        {emptyMsg.icon}
                      </div>
                      <h3 style={{ marginBottom: '16px', fontSize: '24px', fontWeight: 'bold' }}>{emptyMsg.title}</h3>
                      <p style={{ marginBottom: '24px', fontSize: '18px', opacity: 0.9 }}>{emptyMsg.subtitle}</p>
                      {emptyMsg.cta && (
                        <Link href="/camera">
                          <button
                            style={{
                              borderRadius: '16px',
                              border: '2px solid rgba(255, 255, 255, 0.3)',
                              backgroundColor: 'rgba(255, 255, 255, 0.2)',
                              backdropFilter: 'blur(12px)',
                              padding: '16px 32px',
                              fontSize: '18px',
                              fontWeight: 'bold',
                              color: 'white',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.transform = 'scale(1.05)'
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.transform = 'scale(1)'
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                            }}
                          >
                            {emptyMsg.cta}
                          </button>
                        </Link>
                      )}
                    </div>
                  )
                })()}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Main Meal Card with Lazy Loading */}
                <div
                  style={{
                    borderRadius: '24px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(12px)',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  {currentMeals.length > 1 && (
                    <div
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(12px)',
                        position: 'absolute',
                        right: '16px',
                        top: '16px',
                        zIndex: 10,
                        borderRadius: '50px',
                        padding: '6px 12px',
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: '500', color: 'white' }}>
                        {currentMealIndex + 1} of {currentMeals.length}
                      </span>
                    </div>
                  )}

                  {/* Meal Image with Lazy Loading */}
                  <div style={{ position: 'relative', aspectRatio: '4/3', height: '300px', overflow: 'hidden' }}>
                    <LazyImage
                      src={currentMeal?.image_url || ''}
                      alt={currentMeal?.title || 'Delicious Meal'}
                      style={{ width: '100%', height: '100%' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0, 0, 0, 0.4), transparent)' }} />

                    {/* Time Stamp */}
                    <div style={{ position: 'absolute', bottom: '16px', left: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                      <Clock style={{ width: '16px', height: '16px', animation: 'pulse 2s infinite' }} />
                      <span style={{ fontWeight: '500' }}>
                        {currentMeal?.created_at ? formatTime(currentMeal.created_at) : 'N/A'}
                      </span>
                    </div>

                    {/* Achievement Badge */}
                    <div
                      style={{
                        background: 'linear-gradient(to right, #9333ea, #ec4899)',
                        position: 'absolute',
                        left: '16px',
                        top: '16px',
                        borderRadius: '50px',
                        padding: '6px 12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Trophy style={{ width: '12px', height: '12px', color: 'white' }} />
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'white' }}>ANALYZED!</span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Meal Info */}
                  <div style={{ padding: '24px' }}>
                    <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                        {currentMeal?.title || 'Delicious Meal'}
                      </h3>
                      <div
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(12px)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          borderRadius: '50px',
                          padding: '6px 12px',
                        }}
                      >
                        <Flame style={{ width: '16px', height: '16px', color: '#ea580c' }} />
                        <span style={{ fontWeight: 'bold', color: '#7c3aed' }}>
                          {currentMeal?.basic_nutrition?.energy_kcal || 0} cal
                        </span>
                      </div>
                    </div>

                    {/* Enhanced Nutrition Bars */}
                    <div style={{ marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ marginBottom: '4px', fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>Protein</div>
                        <div style={{ marginBottom: '4px', height: '12px', overflow: 'hidden', borderRadius: '50px', backgroundColor: '#dcfce7' }}>
                          <div
                            style={{
                              height: '12px',
                              borderRadius: '50px',
                              background: 'linear-gradient(to right, #22c55e, #16a34a)',
                              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
                              transition: 'all 1s ease',
                              width: `${Math.min((currentMeal?.basic_nutrition?.protein_g || 0) * 2, 100)}%`,
                            }}
                          />
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#16a34a' }}>
                          {currentMeal?.basic_nutrition?.protein_g || 0}g
                        </div>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <div style={{ marginBottom: '4px', fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>Carbs</div>
                        <div style={{ marginBottom: '4px', height: '12px', overflow: 'hidden', borderRadius: '50px', backgroundColor: '#dbeafe' }}>
                          <div
                            style={{
                              height: '12px',
                              borderRadius: '50px',
                              background: 'linear-gradient(to right, #3b82f6, #1d4ed8)',
                              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
                              transition: 'all 1s ease',
                              width: `${Math.min((currentMeal?.basic_nutrition?.carbs_g || 0) * 1.5, 100)}%`,
                            }}
                          />
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1d4ed8' }}>
                          {currentMeal?.basic_nutrition?.carbs_g || 0}g
                        </div>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <div style={{ marginBottom: '4px', fontSize: '14px', fontWeight: '600', color: '#6b7280' }}>Fat</div>
                        <div style={{ marginBottom: '4px', height: '12px', overflow: 'hidden', borderRadius: '50px', backgroundColor: '#fed7aa' }}>
                          <div
                            style={{
                              height: '12px',
                              borderRadius: '50px',
                              background: 'linear-gradient(to right, #f97316, #ea580c)',
                              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
                              transition: 'all 1s ease',
                              width: `${Math.min((currentMeal?.basic_nutrition?.fat_g || 0) * 3, 100)}%`,
                            }}
                          />
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ea580c' }}>
                          {currentMeal?.basic_nutrition?.fat_g || 0}g
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Actions */}
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button 
                        onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
                        style={{
                          background: showDetailedAnalysis 
                            ? 'linear-gradient(to right, #ec4899, #9333ea)'
                            : 'linear-gradient(to right, #10b981, #ea580c)',
                          borderRadius: '12px',
                          padding: '12px 24px',
                          fontWeight: '600',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          boxShadow: showDetailedAnalysis 
                            ? '0 8px 25px rgba(236, 72, 153, 0.3)'
                            : '0 8px 25px rgba(16, 185, 129, 0.3)',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'scale(1.05)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'scale(1)'
                        }}
                      >
                        {showDetailedAnalysis ? '🎯 Hide Deep Insights' : '📊 Deep Insights'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Horizontal Navigation for Today's Meals */}
                {currentMeals.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                    <button
                      onClick={handlePrevMeal}
                      style={{
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
                        padding: '12px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'scale(1.1)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'scale(1)'
                      }}
                      title="Previous Meal"
                    >
                      <ChevronLeft style={{ width: '20px', height: '20px', color: '#7c3aed' }} />
                    </button>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      {currentMeals.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentMealIndex(index)}
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            background: index === currentMealIndex
                              ? 'linear-gradient(to right, #10b981, #ea580c)'
                              : 'rgba(255, 255, 255, 0.6)',
                            transform: index === currentMealIndex ? 'scale(1.1)' : 'scale(1)',
                            boxShadow: index === currentMealIndex ? '0 8px 25px rgba(16, 185, 129, 0.3)' : 'none',
                          }}
                          onMouseEnter={e => {
                            if (index !== currentMealIndex) {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'
                            }
                          }}
                          onMouseLeave={e => {
                            if (index !== currentMealIndex) {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.6)'
                            }
                          }}
                          title={`Meal ${index + 1}`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={handleNextMeal}
                      style={{
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
                        padding: '12px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'scale(1.1)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'scale(1)'
                      }}
                      title="Next Meal"
                    >
                      <ChevronRight style={{ width: '20px', height: '20px', color: '#7c3aed' }} />
                    </button>
                  </div>
                )}

                {/* Analysis Modes - Beautiful Accordion */}
                {showDetailedAnalysis && currentMeal && (
                  <div 
                    style={{ 
                      marginTop: '24px',
                      borderRadius: '24px',
                      background: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(12px)',
                      overflow: 'hidden',
                      boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      animation: 'slideDown 0.3s ease-out',
                    }}
                  >
                    {/* Analysis Header */}
                    <div
                      style={{
                        background: 'linear-gradient(to right, #9333ea, #ec4899)',
                        padding: '24px',
                        color: 'white',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ marginBottom: '8px', fontSize: '32px' }}>🤖</div>
                      <h3 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                        Deep Insights
                      </h3>
                      <p style={{ margin: 0, opacity: 0.9 }}>
                        Unlock detailed analysis about your meal with advanced nutrition insights
                      </p>
                    </div>
                    
                    {/* Analysis Content */}
                    <div style={{ padding: '24px' }}>
                      <SmartAnalysisModes meal={currentMeal} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Conversion Triggers */}
            {triggers.map(trigger => (
              <div key={trigger.id} style={{ marginTop: '24px' }}>
                <ConversionTrigger
                  triggerType={trigger.type as any}
                  context={trigger.context}
                  onDismiss={() => removeTrigger(trigger.id)}
                />
              </div>
            ))}
          </div>
        )}

        {/* WEEK VIEW with Smart Boundaries */}
        {activeTab === 'week' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Week Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={() => handleWeekNavigation('prev')}
                style={{
                  background: 'linear-gradient(to right, #10b981, #ea580c)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  borderRadius: '16px',
                  padding: '16px 24px',
                  fontWeight: '600',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <ChevronLeft style={{ width: '20px', height: '20px' }} />
                <span>Previous Week</span>
              </button>

              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
                  {currentWeekOffset === 0
                    ? 'Current Week'
                    : currentWeekOffset === -1
                      ? '1 Week Ago'
                      : `${Math.abs(currentWeekOffset)} Weeks Ago`}
                </h3>
              </div>

              {currentWeekOffset < 0 ? (
                <button
                  onClick={() => handleWeekNavigation('next')}
                  style={{
                    background: 'linear-gradient(to right, #10b981, #ea580c)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    borderRadius: '16px',
                    padding: '16px 24px',
                    fontWeight: '600',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 8px 25px rgba(16, 185, 129, 0.3)',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.05)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)'
                  }}
                >
                  <span>Next Week</span>
                  <ChevronRight style={{ width: '20px', height: '20px' }} />
                </button>
              ) : (
                <div style={{ width: '128px' }} />
              )}
            </div>

            {/* Week Days with Smart Empty States */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {weekDays.map(day => (
                <div
                  key={day.date}
                  style={{
                    borderRadius: '24px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(12px)',
                    overflow: 'hidden',
                    boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
                  }}
                >
                  {/* Day Header */}
                  <div
                    style={{
                      padding: '24px',
                      background: day.isToday 
                        ? 'linear-gradient(to right, #10b981, #ea580c)'
                        : '#f9fafb',
                      color: day.isToday ? 'white' : '#111827',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{formatDate(day.date)}</span>
                        {day.isToday && (
                          <div
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              backdropFilter: 'blur(12px)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              borderRadius: '50px',
                              padding: '8px 16px',
                            }}
                          >
                            <Star style={{ width: '16px', height: '16px' }} />
                            <span style={{ fontSize: '14px', fontWeight: '600' }}>TODAY</span>
                          </div>
                        )}
                      </div>
                      <span style={{ fontWeight: '600', opacity: 0.9 }}>
                        {day.meals.length} meal{day.meals.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  {/* Day Meals with Lazy Loading */}
                  <div style={{ padding: '24px' }}>
                    {!day.canBrowse ? (
                      <div
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(12px)',
                          borderRadius: '16px',
                          padding: '24px',
                          textAlign: 'center',
                        }}
                      >
                        <Calendar style={{ width: '32px', height: '32px', color: '#9ca3af', margin: '0 auto 12px' }} />
                        <p style={{ fontWeight: '500', color: '#6b7280', margin: '0 0 4px' }}>Journey begins here</p>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>You joined on {formatDate(registrationDate?.split('T')[0] || '')}</p>
                      </div>
                    ) : day.meals.length === 0 ? (
                      (() => {
                        const emptyMsg = getEmptyDayMessage(day.date, day.canBrowse)
                        return (
                          <div
                            style={{
                              borderRadius: '16px',
                              padding: '24px',
                              textAlign: 'center',
                              color: 'white',
                              backgroundImage: day.canBrowse 
                                ? 'linear-gradient(to right, #16a34a, #22c55e)'
                                : 'linear-gradient(to right, #6b7280, #4b5563)',
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
                              }}
                            >
                              {React.cloneElement(emptyMsg.icon, { style: { width: '24px', height: '24px' } })}
                            </div>
                            <h4 style={{ marginBottom: '8px', fontWeight: 'bold' }}>{emptyMsg.title}</h4>
                            <p style={{ fontSize: '14px', opacity: 0.9, margin: 0 }}>{emptyMsg.subtitle}</p>
                          </div>
                        )
                      })()
                    ) : (
                      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
                        {day.meals.map(meal => (
                          <div
                            key={meal.id}
                            style={{
                              borderRadius: '16px',
                              background: 'rgba(255, 255, 255, 0.95)',
                              backdropFilter: 'blur(12px)',
                              width: '160px',
                              flexShrink: 0,
                              overflow: 'hidden',
                              transition: 'all 0.3s ease',
                              boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.transform = 'scale(1.05)'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.transform = 'scale(1)'
                            }}
                          >
                            <div style={{ position: 'relative', aspectRatio: '1', height: '120px', overflow: 'hidden' }}>
                              <LazyImage
                                src={meal.image_url}
                                alt={meal.title || 'Delicious Meal'}
                                style={{ width: '100%', height: '100%' }}
                              />
                              <div
                                style={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                  backdropFilter: 'blur(12px)',
                                  position: 'absolute',
                                  right: '8px',
                                  top: '8px',
                                  borderRadius: '8px',
                                  padding: '4px 8px',
                                }}
                              >
                                <span style={{ fontSize: '12px', fontWeight: '500', color: 'white' }}>
                                  {formatTime(meal.created_at)}
                                </span>
                              </div>
                            </div>
                            <div style={{ padding: '12px' }}>
                              <h5 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {meal.title || 'Delicious Meal'}
                              </h5>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
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
                                  <div style={{ height: '12px', width: '4px', borderRadius: '2px', backgroundColor: '#22c55e' }} />
                                  <div style={{ height: '12px', width: '4px', borderRadius: '2px', backgroundColor: '#3b82f6' }} />
                                  <div style={{ height: '12px', width: '4px', borderRadius: '2px', backgroundColor: '#f97316' }} />
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
        {!isPremium && !showFirstTimeMessage && (
          <div
            style={{
              borderRadius: '24px',
              background: 'linear-gradient(to right, #9333ea, #ec4899)',
              marginTop: '48px',
              overflow: 'hidden',
              padding: '32px',
              textAlign: 'center',
              color: 'white',
              boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
              }}
            />
            <div style={{ position: 'relative', zIndex: 10 }}>
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(12px)',
                  width: '64px',
                  height: '64px',
                  margin: '0 auto 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                }}
              >
                <Crown style={{ width: '32px', height: '32px', color: '#eab308' }} />
              </div>
              <h3 style={{ marginBottom: '16px', fontSize: '32px', fontWeight: 'bold' }}>🚀 Supercharge Your Food Journey!</h3>
              <p style={{ marginBottom: '32px', fontSize: '18px', opacity: 0.9 }}>
                Unlock unlimited storage, advanced insights, and exclusive features that make every meal extraordinary!
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '400px', margin: '0 auto' }}>
                <Link href="/upgrade">
                  <button
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(12px)',
                      width: '100%',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '16px',
                      padding: '24px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      color: '#111827',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'scale(1.05)'
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)'
                    }}
                  >
                    <div style={{ fontSize: '24px' }}>$4.99</div>
                    <div style={{ fontSize: '14px', opacity: 0.9 }}>per month</div>
                  </button>
                </Link>
                <Link href="/upgrade">
                  <button
                    style={{
                      background: 'linear-gradient(to right, #f59e0b, #d97706)',
                      position: 'relative',
                      width: '100%',
                      borderRadius: '16px',
                      padding: '24px',
                      fontWeight: 'bold',
                      color: '#92400e',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 8px 25px rgba(245, 158, 11, 0.3)',
                      transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'scale(1.05)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        backgroundColor: '#22c55e',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        padding: '4px 8px',
                        borderRadius: '50px',
                      }}
                    >
                      BEST VALUE
                    </div>
                    <div style={{ fontSize: '24px' }}>$49.99</div>
                    <div style={{ fontSize: '14px' }}>per year • Save 17%! 🎉</div>
                    <div style={{ fontSize: '12px', opacity: 0.75, marginTop: '4px' }}>Only $4.17/month</div>
                  </button>
                </Link>
              </div>
              <p style={{ marginTop: '24px', fontSize: '14px', opacity: 0.8 }}>
                ⚡ Instant access • 🔄 Cancel anytime • 🌱 Transform your nutrition!
              </p>
            </div>
          </div>
        )}

        {/* Premium Testing Panel */}
        <PremiumTestingPanel 
          isVisible={showTestingPanel}
          onToggle={() => setShowTestingPanel(!showTestingPanel)}
        />

        {/* Quick Action Button */}
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 50 }}>
          <Link href="/camera">
            <button
              style={{
                background: 'linear-gradient(to right, #10b981, #ea580c)',
                display: 'flex',
                width: '64px',
                height: '64px',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.1)'
                e.currentTarget.style.boxShadow = '0 35px 70px rgba(0, 0, 0, 0.35)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.25)'
              }}
              title="Capture New Meal"
            >
              <Camera style={{ width: '28px', height: '28px', color: 'white' }} />
            </button>
          </Link>
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
      </div>
    </AppLayout>
  )
}