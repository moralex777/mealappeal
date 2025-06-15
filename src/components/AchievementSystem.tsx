'use client'

import { Award, Camera, Crown, Share2, Star, Target, Trophy, Zap } from 'lucide-react'
import { useState } from 'react'

import { type IAchievement, type IAchievementBadgeProps } from '@/lib/types'
import { ProgressRing } from './ProgressRing'

const ACHIEVEMENT_DATA: IAchievement[] = [
  {
    id: 'first_meal',
    title: 'First Bite',
    description: 'Capture your first meal with AI analysis',
    icon: '🍽️',
    category: 'meals',
    requirement: 1,
    currentProgress: 0,
    isUnlocked: false,
    rarity: 'common',
    rewardType: 'badge'
  },
  {
    id: 'streak_3',
    title: 'Getting Started',
    description: 'Maintain a 3-day meal tracking streak',
    icon: '🔥',
    category: 'streaks',
    requirement: 3,
    currentProgress: 0,
    isUnlocked: false,
    rarity: 'common',
    rewardType: 'badge'
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: 'Complete a full week of meal tracking',
    icon: '⚡',
    category: 'streaks',
    requirement: 7,
    currentProgress: 0,
    isUnlocked: false,
    rarity: 'rare',
    rewardType: 'feature'
  },
  {
    id: 'meals_10',
    title: 'Food Explorer',
    description: 'Analyze 10 different meals',
    icon: '📸',
    category: 'meals',
    requirement: 10,
    currentProgress: 0,
    isUnlocked: false,
    rarity: 'common',
    rewardType: 'badge'
  },
  {
    id: 'nutrition_score_90',
    title: 'Nutrition Expert',
    description: 'Achieve 90+ average nutrition score',
    icon: '🌱',
    category: 'nutrition',
    requirement: 90,
    currentProgress: 0,
    isUnlocked: false,
    rarity: 'epic',
    rewardType: 'feature'
  },
  {
    id: 'social_shares_5',
    title: 'Social Butterfly',
    description: 'Share 5 meals with the community',
    icon: '🦋',
    category: 'social',
    requirement: 5,
    currentProgress: 0,
    isUnlocked: false,
    rarity: 'rare',
    rewardType: 'badge'
  },
  {
    id: 'premium_upgrade',
    title: 'Premium Champion',
    description: 'Upgrade to premium membership',
    icon: '👑',
    category: 'premium',
    requirement: 1,
    currentProgress: 0,
    isUnlocked: false,
    rarity: 'legendary',
    rewardType: 'feature'
  },
  {
    id: 'streak_30',
    title: 'Consistency King',
    description: 'Maintain a 30-day streak',
    icon: '👑',
    category: 'streaks',
    requirement: 30,
    currentProgress: 0,
    isUnlocked: false,
    rarity: 'legendary',
    rewardType: 'discount'
  }
]

function AchievementBadge({ achievement, showProgress = true, onClick }: IAchievementBadgeProps) {
  const progressPercentage = Math.min(100, (achievement.currentProgress / achievement.requirement) * 100)

  const getRarityStyle = () => {
    switch (achievement.rarity) {
      case 'legendary':
        return {
          border: 'border-purple-500/50',
          background: 'from-purple-100 via-pink-100 to-purple-100',
          glow: 'shadow-purple-500/25',
          text: 'text-purple-900'
        }
      case 'epic':
        return {
          border: 'border-orange-500/50',
          background: 'from-orange-100 via-yellow-100 to-orange-100',
          glow: 'shadow-orange-500/25',
          text: 'text-orange-900'
        }
      case 'rare':
        return {
          border: 'border-blue-500/50',
          background: 'from-blue-100 via-cyan-100 to-blue-100',
          glow: 'shadow-blue-500/25',
          text: 'text-blue-900'
        }
      default:
        return {
          border: 'border-gray-300/50',
          background: 'from-gray-100 via-slate-100 to-gray-100',
          glow: 'shadow-gray-500/25',
          text: 'text-gray-900'
        }
    }
  }

  const style = getRarityStyle()

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-2xl border ${style.border} bg-gradient-to-br ${style.background}
        p-4 shadow-xl ${style.glow} transition-all duration-300 hover:scale-105
        cursor-pointer ${achievement.isUnlocked ? 'animate-pulse' : ''}
      `}
    >
      {/* Rarity indicator */}
      <div className="absolute top-2 right-2">
        {achievement.rarity === 'legendary' && <Crown className="h-4 w-4 text-purple-600" />}
        {achievement.rarity === 'epic' && <Star className="h-4 w-4 text-orange-600" />}
        {achievement.rarity === 'rare' && <Zap className="h-4 w-4 text-blue-600" />}
        {achievement.rarity === 'common' && <Award className="h-4 w-4 text-gray-600" />}
      </div>

      {/* Achievement icon and progress */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative">
          <div className={`
            text-3xl transition-all duration-300
            ${achievement.isUnlocked ? 'scale-110 animate-bounce' : ''}
            ${progressPercentage > 0 ? '' : 'grayscale opacity-50'}
          `}>
            {achievement.icon}
          </div>

          {showProgress && progressPercentage > 0 && progressPercentage < 100 && (
            <div className="absolute -bottom-1 -right-1">
              <ProgressRing
                progress={progressPercentage}
                size="sm"
                color={achievement.rarity === 'legendary' ? 'purple' : achievement.rarity === 'epic' ? 'orange' : 'blue'}
                showLabel={false}
              />
            </div>
          )}
        </div>

        <div className="flex-1">
          <h4 className={`font-bold ${style.text} mb-1`}>
            {achievement.title}
          </h4>
          <p className="text-xs text-gray-600 leading-tight">
            {achievement.description}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {showProgress && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-gray-600">Progress</span>
            <span className={`font-semibold ${style.text}`}>
              {achievement.currentProgress}/{achievement.requirement}
            </span>
          </div>

          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`
                h-full transition-all duration-1000 ease-out
                ${achievement.rarity === 'legendary' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : ''}
                ${achievement.rarity === 'epic' ? 'bg-gradient-to-r from-orange-500 to-yellow-500' : ''}
                ${achievement.rarity === 'rare' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : ''}
                ${achievement.rarity === 'common' ? 'bg-gradient-to-r from-gray-500 to-slate-500' : ''}
              `}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Reward indicator */}
      {achievement.rewardType && (
        <div className="mt-3 flex items-center gap-2">
          <div className="text-xs font-semibold text-gray-600">Reward:</div>
          <div className="flex items-center gap-1 text-xs">
            {achievement.rewardType === 'feature' && <><Zap className="h-3 w-3" /> Feature Unlock</>}
            {achievement.rewardType === 'badge' && <><Trophy className="h-3 w-3" /> Badge</>}
            {achievement.rewardType === 'discount' && <><Target className="h-3 w-3" /> 10% Discount</>}
          </div>
        </div>
      )}

      {/* Unlock celebration effect */}
      {achievement.isUnlocked && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1 left-1 h-2 w-2 rounded-full bg-yellow-400 animate-ping" />
          <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-green-400 animate-ping" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-1 left-1 h-2 w-2 rounded-full bg-blue-400 animate-ping" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-pink-400 animate-ping" style={{ animationDelay: '1.5s' }} />
        </div>
      )}
    </div>
  )
}

export function AchievementSystem({ userProgress }: { userProgress?: any }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedAchievement, setSelectedAchievement] = useState<IAchievement | null>(null)

  // Update achievements with user progress (would come from props/context in real app)
  const achievements = ACHIEVEMENT_DATA.map(achievement => ({
    ...achievement,
    currentProgress: userProgress?.[achievement.id] || 0,
    isUnlocked: (userProgress?.[achievement.id] || 0) >= achievement.requirement
  }))

  const categories = [
    { id: 'all', name: 'All', icon: Trophy },
    { id: 'meals', name: 'Meals', icon: Camera },
    { id: 'streaks', name: 'Streaks', icon: Zap },
    { id: 'nutrition', name: 'Nutrition', icon: Target },
    { id: 'social', name: 'Social', icon: Share2 },
    { id: 'premium', name: 'Premium', icon: Crown }
  ]

  const filteredAchievements = selectedCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === selectedCategory)

  const unlockedCount = achievements.filter(a => a.isUnlocked).length
  const totalCount = achievements.length
  const completionPercentage = (unlockedCount / totalCount) * 100

  return (
    <div className="space-y-6">
      {/* Header with overall progress */}
      <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/90 to-white/70 p-6 shadow-xl backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Achievement Center</h2>
            <p className="text-gray-600">Complete challenges and unlock rewards! 🏆</p>
          </div>
          <div className="text-center">
            <ProgressRing
              progress={completionPercentage}
              size="lg"
              color="purple"
              showLabel={true}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50">
            <div className="text-2xl font-bold text-green-900">{unlockedCount}</div>
            <div className="text-xs text-green-700">Unlocked</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50">
            <div className="text-2xl font-bold text-blue-900">{totalCount - unlockedCount}</div>
            <div className="text-xs text-blue-700">Remaining</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="text-2xl font-bold text-purple-900">{Math.round(completionPercentage)}%</div>
            <div className="text-xs text-purple-700">Complete</div>
          </div>
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => {
          const IconComponent = category.icon
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200
                ${selectedCategory === category.id
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg scale-105'
                  : 'bg-white/80 text-gray-700 hover:bg-white hover:scale-105'
                }
              `}
            >
              <IconComponent className="h-4 w-4" />
              <span className="text-sm">{category.name}</span>
            </button>
          )
        })}
      </div>

      {/* Achievement grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAchievements.map(achievement => (
          <AchievementBadge
            key={achievement.id}
            achievement={achievement}
            showProgress={true}
            onClick={() => setSelectedAchievement(achievement)}
          />
        ))}
      </div>

      {/* Achievement detail modal */}
      {selectedAchievement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="max-w-md w-full rounded-2xl border border-white/20 bg-gradient-to-br from-white/95 to-white/80 p-6 shadow-2xl backdrop-blur-xl">
            <div className="text-center space-y-4">
              <div className="text-6xl mb-4">{selectedAchievement.icon}</div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {selectedAchievement.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {selectedAchievement.description}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Progress:</span>
                  <span className="font-bold">
                    {selectedAchievement.currentProgress}/{selectedAchievement.requirement}
                  </span>
                </div>

                <ProgressRing
                  progress={Math.min(100, (selectedAchievement.currentProgress / selectedAchievement.requirement) * 100)}
                  size="lg"
                  color="purple"
                />

                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Rarity:</span>
                  <span className={`
                    font-bold capitalize
                    ${selectedAchievement.rarity === 'legendary' ? 'text-purple-600' : ''}
                    ${selectedAchievement.rarity === 'epic' ? 'text-orange-600' : ''}
                    ${selectedAchievement.rarity === 'rare' ? 'text-blue-600' : ''}
                    ${selectedAchievement.rarity === 'common' ? 'text-gray-600' : ''}
                  `}>
                    {selectedAchievement.rarity}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedAchievement(null)}
                className="w-full mt-6 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold py-3 px-6 rounded-xl hover:scale-105 transition-transform"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
