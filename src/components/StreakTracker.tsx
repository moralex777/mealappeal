'use client'

import { Calendar, Flame, Star, Target, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'

import { type IStreakDisplayProps } from '@/lib/types'

export function StreakTracker({ streakData, onStreakCelebration }: IStreakDisplayProps) {
  const [showStreakAnimation, setShowStreakAnimation] = useState(false)
  const [isNewStreak, setIsNewStreak] = useState(false)

  useEffect(() => {
    // Check if this is a new streak milestone
    if (streakData.currentStreak > 0 && streakData.currentStreak % 7 === 0) {
      setIsNewStreak(true)
      setShowStreakAnimation(true)
      setTimeout(() => setShowStreakAnimation(false), 3000)
      onStreakCelebration?.()
    }
  }, [streakData.currentStreak, onStreakCelebration])

  const getStreakLevel = () => {
    if (streakData.currentStreak >= 30) return { level: 'Legendary', emoji: '🏆', color: 'from-purple-500 to-pink-500' }
    if (streakData.currentStreak >= 21) return { level: 'Master', emoji: '👑', color: 'from-yellow-400 to-orange-500' }
    if (streakData.currentStreak >= 14) return { level: 'Expert', emoji: '⭐', color: 'from-blue-500 to-cyan-500' }
    if (streakData.currentStreak >= 7) return { level: 'Rising Star', emoji: '🌟', color: 'from-green-400 to-emerald-500' }
    if (streakData.currentStreak >= 3) return { level: 'Getting Started', emoji: '🔥', color: 'from-orange-400 to-red-500' }
    return { level: 'Beginner', emoji: '🌱', color: 'from-gray-400 to-gray-500' }
  }

  const getStreakMessage = () => {
    const level = getStreakLevel()
    if (streakData.currentStreak === 0) return "Ready to start your journey? 🚀"
    if (streakData.currentStreak === 1) return "Great start! Keep going! 💪"
    if (streakData.currentStreak < 7) return "Building momentum... 🔥"
    if (streakData.currentStreak < 14) return "You're on fire! 🌟"
    if (streakData.currentStreak < 21) return "Unstoppable force! ⚡"
    return "Legendary status achieved! 👑"
  }

  const calculateProgress = () => {
    const nextMilestone = Math.ceil(streakData.currentStreak / 7) * 7 || 7
    return (streakData.currentStreak / nextMilestone) * 100
  }

  const getDaysUntilNextMilestone = () => {
    const nextMilestone = Math.ceil(streakData.currentStreak / 7) * 7 || 7
    return nextMilestone - streakData.currentStreak
  }

  const level = getStreakLevel()

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-gradient-to-br from-white/90 to-white/70 p-6 shadow-xl backdrop-blur-xl">
      {/* Animated background for streak milestones */}
      {showStreakAnimation && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-yellow-400/20 via-orange-500/20 to-red-500/20" />
      )}

      {/* Header */}
      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-full p-3 bg-gradient-to-r ${level.color} shadow-lg`}>
            <Flame className={`h-6 w-6 text-white ${showStreakAnimation ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Daily Streak</h3>
            <p className="text-sm text-gray-600">{level.level} Level {level.emoji}</p>
          </div>
        </div>

        {/* Streak multiplier */}
        <div className="text-right">
          <div className="text-2xl font-bold text-orange-600">
            {streakData.currentStreak}
          </div>
          <div className="text-xs text-gray-500">
            {streakData.currentStreak === 1 ? 'day' : 'days'}
          </div>
        </div>
      </div>

      {/* Progress to next milestone */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Progress to next milestone</span>
          <span className="font-semibold text-gray-900">
            {getDaysUntilNextMilestone()} days to go
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative h-3 overflow-hidden rounded-full bg-gray-200">
          <div
            className={`h-full transition-all duration-1000 ease-out bg-gradient-to-r ${level.color}`}
            style={{ width: `${calculateProgress()}%` }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
        </div>
      </div>

      {/* Streak stats grid */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 p-4 text-center">
          <Target className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <div className="text-xl font-bold text-blue-900">{streakData.longestStreak}</div>
          <div className="text-xs text-blue-600">Best Streak</div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 p-4 text-center">
          <Star className="h-6 w-6 text-green-600 mx-auto mb-2" />
          <div className="text-xl font-bold text-green-900">{streakData.streakMultiplier}x</div>
          <div className="text-xs text-green-600">Multiplier</div>
        </div>
      </div>

      {/* Motivational message */}
      <div className="mt-4 rounded-xl border border-orange-200/50 bg-gradient-to-r from-orange-50 to-yellow-50 p-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{level.emoji}</div>
          <div>
            <p className="text-sm font-semibold text-orange-900">{getStreakMessage()}</p>
            {streakData.currentStreak > 0 && (
              <p className="text-xs text-orange-700 mt-1">
                Last meal: {streakData.lastMealDate ? new Date(streakData.lastMealDate).toLocaleDateString() : 'Never'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Weekly calendar preview */}
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-semibold text-gray-700">This Week</span>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, index) => {
            const dayNumber = index + 1
            const isToday = dayNumber === new Date().getDay() || 0
            const hasActivity = index < streakData.currentStreak % 7

            return (
              <div
                key={index}
                className={`
                  aspect-square flex items-center justify-center rounded-lg text-xs font-medium
                  ${hasActivity
                    ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-400'
                  }
                  ${isToday ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                `}
              >
                {hasActivity ? '🔥' : dayNumber}
              </div>
            )
          })}
        </div>
      </div>

      {/* Streak boost tips */}
      {streakData.currentStreak > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/50">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-900">Streak Booster</span>
          </div>
          <p className="text-xs text-purple-700">
            {streakData.currentStreak < 3 && "Take a photo of your next meal to keep the momentum! 📸"}
            {streakData.currentStreak >= 3 && streakData.currentStreak < 7 && "You're building a powerful habit! Share your journey for extra motivation. 🌟"}
            {streakData.currentStreak >= 7 && "Amazing dedication! Consider upgrading for advanced streak insights. 👑"}
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  )
}
