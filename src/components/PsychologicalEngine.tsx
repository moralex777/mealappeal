'use client'

import { Crown, Star, Target, Users, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'

import { type IConversionTrigger, type IProfile, type IStreakData } from '@/lib/types'
import { AchievementSystem } from './AchievementSystem'
import { CelebrationAnimation } from './CelebrationAnimation'
import { ConversionPrompt } from './ConversionPrompt'
import { ProgressRing } from './ProgressRing'
import { SocialProof } from './SocialProof'
import { StreakTracker } from './StreakTracker'

interface PsychologicalEngineProps {
  profile: IProfile | null
  isVisible?: boolean
}

export function PsychologicalEngine({ profile, isVisible = true }: PsychologicalEngineProps) {
  const [activeScreen, setActiveScreen] = useState<'dashboard' | 'streaks' | 'achievements' | 'social'>('dashboard')
  const [showCelebration, setShowCelebration] = useState<any>(null)
  const [showConversion, setShowConversion] = useState<IConversionTrigger | null>(null)
  const [userStats, setUserStats] = useState({
    totalMeals: profile?.meal_count || 0,
    currentStreak: 0,
    longestStreak: 0,
    weeklyGoal: 7,
    nutritionScore: 0,
    socialShares: 0,
    achievementProgress: {}
  })

  // Mock streak data - in real app this would come from backend
  const streakData: IStreakData = {
    currentStreak: userStats.currentStreak,
    longestStreak: userStats.longestStreak,
    lastMealDate: new Date().toISOString(),
    streakMultiplier: Math.min(5, Math.floor(userStats.currentStreak / 7) + 1)
  }

  // Recent activity for social proof
  const recentActivity = [
    "🎯 Alex just achieved their weekly goal!",
    "🔥 Maria reached a 14-day streak!",
    "👑 David upgraded to Premium!",
    "📸 Sarah analyzed 50 meals!",
    "⭐ Mike earned the Nutrition Expert badge!"
  ]

  useEffect(() => {
    // Simulate user progress updates
    const updateStats = () => {
      setUserStats(prev => ({
        ...prev,
        totalMeals: profile?.meal_count || 0,
        currentStreak: Math.min(30, Math.floor((profile?.meal_count || 0) / 2)),
        longestStreak: Math.max(prev.longestStreak, Math.min(30, Math.floor((profile?.meal_count || 0) / 2))),
        nutritionScore: Math.min(100, 65 + (profile?.meal_count || 0) * 2),
        socialShares: Math.floor((profile?.meal_count || 0) / 3),
        achievementProgress: {
          first_meal: Math.min(1, profile?.meal_count || 0),
          meals_10: Math.min(10, profile?.meal_count || 0),
          streak_3: Math.min(3, Math.floor((profile?.meal_count || 0) / 2)),
          streak_7: Math.min(7, Math.floor((profile?.meal_count || 0) / 2)),
          streak_30: Math.min(30, Math.floor((profile?.meal_count || 0) / 2)),
          premium_upgrade: profile?.subscription_tier === 'premium' ? 1 : 0,
          nutrition_score_90: userStats.nutritionScore >= 90 ? 90 : userStats.nutritionScore,
          social_shares_5: Math.min(5, Math.floor((profile?.meal_count || 0) / 3))
        }
      }))
    }

    updateStats()
  }, [profile, userStats.nutritionScore])

  useEffect(() => {
    // Trigger celebrations for achievements
    if (userStats.totalMeals === 1 && !showCelebration) {
      setShowCelebration({
        type: 'achievement',
        message: 'First meal analyzed! 🎉',
        intensity: 'moderate'
      })
    }

    if (userStats.currentStreak > 0 && userStats.currentStreak % 7 === 0 && !showCelebration) {
      setShowCelebration({
        type: 'streak',
        message: `${userStats.currentStreak} day streak! You're on fire! 🔥`,
        intensity: 'explosive'
      })
    }

    if (profile?.subscription_tier === 'premium' && !showCelebration) {
      setShowCelebration({
        type: 'upgrade',
        message: 'Welcome to Premium! 👑',
        intensity: 'explosive'
      })
    }
  }, [userStats, profile?.subscription_tier, showCelebration])

  useEffect(() => {
    // Trigger conversion prompts based on user behavior
    if (!profile) return

    const triggerConversion = () => {
      if (profile.subscription_tier === 'premium') return

      const mealCount = profile.meal_count || 0
      const daysInTrial = Math.floor(mealCount / 2) // Simulate days based on meals

      // Different triggers based on user journey stage
      if (mealCount >= 5 && mealCount < 10 && Math.random() < 0.3) {
        setShowConversion({
          type: 'social_proof',
          message: 'Join thousands of users who upgraded to unlock advanced AI insights!',
          ctaText: 'Upgrade to Premium',
          intensity: 'medium',
          timing: 'immediate',
          audience: 'free'
        })
      } else if (mealCount >= 10 && mealCount < 15 && Math.random() < 0.4) {
        setShowConversion({
          type: 'value_stack',
          message: 'See everything you get with Premium - worth $82/month for just $4.99!',
          ctaText: 'Get Premium Value',
          intensity: 'medium',
          timing: 'immediate',
          audience: 'trial'
        })
      } else if (daysInTrial >= 10 && Math.random() < 0.5) {
        setShowConversion({
          type: 'urgency',
          message: 'Your trial is ending soon! Don\'t lose your progress.',
          ctaText: 'Save My Data',
          intensity: 'high',
          timing: 'immediate',
          audience: 'expired'
        })
      } else if (mealCount >= 7 && Math.random() < 0.2) {
        setShowConversion({
          type: 'scarcity',
          message: 'Limited time: Save 17% with annual Premium!',
          ctaText: 'Claim Discount',
          intensity: 'high',
          timing: 'immediate',
          audience: 'free'
        })
      }
    }

    // Random conversion trigger (simulate real user behavior analysis)
    const conversionTimer = setTimeout(triggerConversion, Math.random() * 10000 + 5000)
    return () => clearTimeout(conversionTimer)
  }, [profile])

  const handleUpgrade = () => {
    // In real app, this would trigger the upgrade flow
    window.location.href = '/upgrade'
  }

  const handleStreakCelebration = () => {
    setShowCelebration({
      type: 'streak',
      message: `Streak milestone reached! 🎯`,
      intensity: 'explosive'
    })
  }

  if (!isVisible) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-4">
      {/* Navigation */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex flex-wrap gap-2 p-2 rounded-2xl bg-white/60 backdrop-blur-lg border border-white/20">
          {[
            { id: 'dashboard', name: 'Dashboard', icon: Target },
            { id: 'streaks', name: 'Streaks', icon: Zap },
            { id: 'achievements', name: 'Achievements', icon: Star },
            { id: 'social', name: 'Community', icon: Users }
          ].map(tab => {
            const IconComponent = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveScreen(tab.id as any)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300
                  ${activeScreen === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg scale-105'
                    : 'text-gray-700 hover:bg-white/50 hover:scale-105'
                  }
                `}
              >
                <IconComponent className="h-4 w-4" />
                <span className="text-sm">{tab.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        {activeScreen === 'dashboard' && (
          <div className="space-y-6">
            {/* Welcome header */}
            <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/90 to-white/70 p-6 shadow-xl backdrop-blur-xl text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                Welcome back, {profile?.full_name?.split(' ')[0] || 'Friend'}! 👋
              </h1>
              <p className="text-gray-600 mb-4">
                Keep building those healthy habits! You're doing amazing! ✨
              </p>

              {/* Quick stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50">
                  <div className="text-2xl font-bold text-blue-900">{userStats.totalMeals}</div>
                  <div className="text-xs text-blue-700">Meals Analyzed</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-gradient-to-br from-orange-50 to-red-50">
                  <div className="text-2xl font-bold text-orange-900">{userStats.currentStreak}</div>
                  <div className="text-xs text-orange-700">Day Streak</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50">
                  <div className="text-2xl font-bold text-green-900">{userStats.nutritionScore}</div>
                  <div className="text-xs text-green-700">Nutrition Score</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50">
                  <div className="text-2xl font-bold text-purple-900">
                    {Object.values(userStats.achievementProgress).filter((v: any) => v >= 1).length}
                  </div>
                  <div className="text-xs text-purple-700">Achievements</div>
                </div>
              </div>
            </div>

            {/* Weekly progress */}
            <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/90 to-white/70 p-6 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Weekly Goal Progress</h3>
                  <p className="text-gray-600">You're {Math.round((userStats.totalMeals % 7 / 7) * 100)}% to your weekly goal!</p>
                </div>
                <ProgressRing
                  progress={Math.round((userStats.totalMeals % 7 / 7) * 100)}
                  size="lg"
                  color="purple"
                  showLabel={true}
                />
              </div>

              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, index) => {
                  const hasActivity = index < (userStats.totalMeals % 7)
                  return (
                    <div
                      key={index}
                      className={`
                        aspect-square flex items-center justify-center rounded-lg text-sm font-medium
                        ${hasActivity
                          ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-400'
                        }
                      `}
                    >
                      {hasActivity ? '✓' : index + 1}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/90 to-white/70 p-6 shadow-xl backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Analyze Your Meal</h4>
                    <p className="text-sm text-gray-600">Capture and analyze your next meal</p>
                  </div>
                </div>
                <button className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-3 px-6 rounded-xl hover:scale-105 transition-transform">
                  Take Photo 📸
                </button>
              </div>

              {profile?.subscription_tier !== 'premium' && (
                <div className="rounded-2xl border border-orange-300/50 bg-gradient-to-br from-orange-50 to-yellow-50 p-6 shadow-xl backdrop-blur-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500">
                      <Crown className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-orange-900">Upgrade to Premium</h4>
                      <p className="text-sm text-orange-700">Unlock advanced features</p>
                    </div>
                  </div>
                  <button
                    onClick={handleUpgrade}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold py-3 px-6 rounded-xl hover:scale-105 transition-transform"
                  >
                    Get Premium 👑
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeScreen === 'streaks' && (
          <StreakTracker
            streakData={streakData}
            onStreakCelebration={handleStreakCelebration}
          />
        )}

        {activeScreen === 'achievements' && (
          <AchievementSystem userProgress={userStats.achievementProgress} />
        )}

        {activeScreen === 'social' && (
          <SocialProof
            userCount={12500}
            recentActivity={recentActivity}
            conversionRate={15}
          />
        )}
      </div>

      {/* Overlays */}
      {showCelebration && (
        <CelebrationAnimation
          type={showCelebration.type}
          message={showCelebration.message}
          intensity={showCelebration.intensity}
          onComplete={() => setShowCelebration(null)}
        />
      )}

      {showConversion && (
        <ConversionPrompt
          trigger={showConversion}
          profile={profile}
          onDismiss={() => setShowConversion(null)}
          onUpgrade={handleUpgrade}
        />
      )}
    </div>
  )
}
