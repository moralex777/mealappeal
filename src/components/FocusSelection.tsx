'use client'

import { Clock, Crown, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'

interface AnalysisFocus {
  id: string
  name: string
  description: string
  icon: string
  tier: 'free' | 'premium' | 'both'
  popularity: number
  color: string
  shortDesc: string
}

const analysisFocusOptions: AnalysisFocus[] = [
  {
    id: 'health_wellness',
    name: 'Health & Wellness',
    description: 'Personalized health insights and wellness optimization',
    shortDesc: 'Health benefits & nutrition',
    icon: '🪷',
    tier: 'premium',
    popularity: 85,
    color: 'from-green-400 to-emerald-500',
  },
  {
    id: 'fitness_fuel',
    name: 'Fitness Fuel',
    description: 'Athletic performance and fitness optimization',
    shortDesc: 'Athletic performance',
    icon: '💪',
    tier: 'premium',
    popularity: 83,
    color: 'from-yellow-400 to-orange-500',
  },
  {
    id: 'cultural_story',
    name: 'Cultural Story',
    description: 'Origins, traditions, and hidden mysteries',
    shortDesc: 'Origins & traditions',
    icon: '🌍',
    tier: 'premium',
    popularity: 88,
    color: 'from-blue-400 to-indigo-500',
  },
  {
    id: 'budget_smart',
    name: 'Budget Smart',
    description: 'Cost-effective nutrition and money-saving tips',
    shortDesc: 'Smart & affordable',
    icon: '💰',
    tier: 'premium',
    popularity: 74,
    color: 'from-emerald-400 to-teal-500',
  },
  {
    id: 'chef_secrets',
    name: 'Chef Secrets',
    description: 'Professional cooking techniques and simple recipes',
    shortDesc: 'Pro cooking techniques',
    icon: '👨‍🍳',
    tier: 'premium',
    popularity: 91,
    color: 'from-orange-400 to-red-500',
  },
  {
    id: 'science_lab',
    name: 'Science Lab',
    description: 'Scientific nutrition analysis and molecular insights',
    shortDesc: 'Scientific research',
    icon: '🔬',
    tier: 'premium',
    popularity: 68,
    color: 'from-purple-400 to-pink-500',
  },
]

interface FocusSelectionProps {
  userTier: 'free' | 'premium'
  onFocusSelect: (focusId: string) => void
  selectedFocus?: string | null
  recentSelections?: string[]
}

export default function FocusSelection({
  userTier,
  onFocusSelect,
  selectedFocus,
  recentSelections = [],
}: FocusSelectionProps) {
  const [showAnimation, setShowAnimation] = useState(false)
  const [hoveredFocus, setHoveredFocus] = useState<string | null>(null)

  // All modes are premium now
  const availableFocus = analysisFocusOptions.filter(focus => userTier === 'premium')
  const lockedFocus = userTier === 'free' ? analysisFocusOptions : []

  useEffect(() => {
    setShowAnimation(true)
  }, [])

  const handleFocusSelect = (focusId: string) => {
    if (userTier === 'free') {
      return
    } // Locked for free users
    onFocusSelect(focusId)
  }

  const getTrendingLabel = (popularity: number) => {
    if (popularity > 85) {
      return { label: '🔥 Viral', color: 'text-red-500' }
    }
    if (popularity > 80) {
      return { label: '📈 Trending', color: 'text-orange-500' }
    }
    if (popularity > 75) {
      return { label: '⭐ Popular', color: 'text-yellow-500' }
    }
    return null
  }

  return (
    <div className="rounded-2xl border border-white/20 bg-white/90 p-6 shadow-lg backdrop-blur-sm">
      <div className="mb-6 text-center">
        <h3 className="gradient-text mb-2 text-2xl font-bold">🎯 Choose Your Insight Style</h3>
        <p className="text-gray-600">Each focus reveals different insights about your food</p>
      </div>

      {/* Premium Focus Options - FIXED LAYOUT */}
      {userTier === 'premium' && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
          {availableFocus.map((focus, index) => {
            const trending = getTrendingLabel(focus.popularity)
            const isSelected = selectedFocus === focus.id
            const isRecent = recentSelections.includes(focus.id)

            return (
              <button
                key={focus.id}
                onClick={() => handleFocusSelect(focus.id)}
                onMouseEnter={() => setHoveredFocus(focus.id)}
                onMouseLeave={() => setHoveredFocus(null)}
                className={`relative flex h-28 transform flex-col justify-between rounded-xl border-2 p-4 transition-all duration-300 ${showAnimation ? 'animate-fade-in' : 'opacity-0'} ${
                  isSelected
                    ? 'border-brand-400 bg-brand-50 scale-105 shadow-lg'
                    : 'hover:border-brand-300 border-gray-200 bg-white hover:scale-105 hover:shadow-md'
                } `}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Focus Icon & Name - FIXED: Inline layout */}
                <div className="text-center">
                  <div className="mb-1 transform text-2xl transition-transform duration-200 hover:scale-110">
                    {focus.icon}
                  </div>
                  <div className="text-sm leading-tight font-semibold text-gray-800">
                    {focus.name}
                  </div>
                </div>

                {/* Status Indicators - FIXED: Inline */}
                <div className="text-center">
                  {trending && (
                    <div className={`text-xs font-medium ${trending.color}`}>{trending.label}</div>
                  )}

                  {isRecent && (
                    <div className="flex items-center justify-center gap-1 text-xs font-medium text-orange-600">
                      <Clock className="h-3 w-3" />
                      Recent
                    </div>
                  )}
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="bg-brand-500 absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full">
                    <Sparkles className="h-3 w-3 text-white" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Locked Premium Section for Free Users */}
      {userTier === 'free' && (
        <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-orange-300 bg-gradient-to-br from-orange-50 to-yellow-50 p-6">
          <div className="absolute top-2 right-2">
            <Crown className="h-6 w-6 text-orange-500" />
          </div>

          <h4 className="mb-3 flex items-center gap-2 font-bold text-orange-800">
            <Crown className="h-5 w-5" />
            Premium Insight Modes
          </h4>

          <div className="mb-4 space-y-3">
            {lockedFocus.map(focus => {
              const trending = getTrendingLabel(focus.popularity)
              return (
                <div
                  key={focus.id}
                  className="flex items-center justify-between rounded-lg border border-orange-200 bg-white/60 p-3"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{focus.icon}</span>
                    <span className="font-medium text-gray-800">{focus.name}</span>
                    {trending && (
                      <span className={`text-xs ${trending.color} font-medium`}>
                        {trending.label}
                      </span>
                    )}
                  </div>
                  <div className="rounded-full bg-orange-200 px-2 py-1 text-xs font-medium text-orange-700">
                    PRO
                  </div>
                </div>
              )
            })}
          </div>

          <button className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 font-semibold text-white shadow-lg transition-transform duration-200 hover:scale-105">
            🚀 Upgrade to Premium - $4.99/month
          </button>
        </div>
      )}

      {/* Smart Auto-Select Button */}
      <div className="mt-6 border-t border-gray-200 pt-6">
        <button
          onClick={() => handleFocusSelect('smart_auto')}
          disabled={userTier === 'free'}
          className={`w-full rounded-xl border-2 p-4 transition-all duration-300 hover:scale-105 ${userTier === 'free' ? 'cursor-not-allowed opacity-50' : ''} ${
            selectedFocus === 'smart_auto'
              ? 'border-purple-400 bg-purple-50 shadow-lg'
              : 'border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 hover:border-purple-300'
          } `}
        >
          <div className="flex items-center justify-center space-x-3">
            <span className="text-2xl">🎲</span>
            <div className="text-left">
              <div className="font-bold text-purple-800">Surprise Me!</div>
              <div className="text-sm text-purple-600">Smart picks the perfect insight style</div>
            </div>
            {selectedFocus === 'smart_auto' && userTier === 'premium' && (
              <Sparkles className="h-5 w-5 text-purple-500" />
            )}
          </div>
        </button>
      </div>

      {/* Selection Confirmation */}
      {selectedFocus && selectedFocus !== 'smart_auto' && userTier === 'premium' && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {analysisFocusOptions.find(f => f.id === selectedFocus)?.icon}
            </span>
            <div>
              <div className="font-medium text-green-800">
                {analysisFocusOptions.find(f => f.id === selectedFocus)?.name} Selected
              </div>
              <div className="text-sm text-green-600">Ready for specialized insights!</div>
            </div>
          </div>
        </div>
      )}

      {selectedFocus === 'smart_auto' && userTier === 'premium' && (
        <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50 p-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎲</span>
            <div>
              <div className="font-medium text-purple-800">Smart Mode Activated</div>
              <div className="text-sm text-purple-600">
                Smart mode will choose the best insight style for your food
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
