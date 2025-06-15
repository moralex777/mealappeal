'use client'

import { ArrowUp, Heart, Star, TrendingUp, Users } from 'lucide-react'
import { useEffect, useState } from 'react'

import { type ISocialProofProps } from '@/lib/types'

export function SocialProof({
  userCount,
  recentActivity,
  conversionRate = 15,
  testimonials = []
}: ISocialProofProps) {
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [animatedUserCount, setAnimatedUserCount] = useState(0)
  const [showLiveActivity, setShowLiveActivity] = useState(false)

  const defaultTestimonials = [
    "MealAppeal transformed how I understand my nutrition! The AI insights are incredible. 🌟",
    "I've lost 15 pounds just by understanding what I eat better. Premium features are worth every penny! 💪",
    "The streak tracking keeps me motivated daily. Best investment in my health journey! 🔥",
    "Community support + AI analysis = perfect combo for healthy living! ⭐",
    "From confused about calories to nutrition expert in 30 days. Life changing! 🎯"
  ]

  const displayTestimonials = testimonials.length > 0 ? testimonials : defaultTestimonials

  useEffect(() => {
    // Animate user count
    const increment = userCount / 50
    const timer = setInterval(() => {
      setAnimatedUserCount(prev => {
        const next = prev + increment
        return next >= userCount ? userCount : next
      })
    }, 50)

    // Show live activity periodically
    setShowLiveActivity(true)
    const activityTimer = setInterval(() => {
      setShowLiveActivity(prev => !prev)
    }, 3000)

    return () => {
      clearInterval(timer)
      clearInterval(activityTimer)
    }
  }, [userCount])

  useEffect(() => {
    // Rotate testimonials
    const testimonialTimer = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % displayTestimonials.length)
    }, 4000)

    return () => clearInterval(testimonialTimer)
  }, [displayTestimonials.length])

  const formatUserCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  return (
    <div className="space-y-4">
      {/* Main social proof card */}
      <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-white/90 to-white/70 p-6 shadow-xl backdrop-blur-xl">
        {/* Header stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold text-blue-900">
                {formatUserCount(Math.floor(animatedUserCount))}
              </span>
            </div>
            <p className="text-xs text-gray-600">Active Users</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-900">{conversionRate}%</span>
            </div>
            <p className="text-xs text-gray-600">Upgrade Today</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <span className="text-2xl font-bold text-yellow-900">4.9</span>
            </div>
            <p className="text-xs text-gray-600">App Rating</p>
          </div>
        </div>

        {/* Live activity ticker */}
        <div className="rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full bg-green-500 ${showLiveActivity ? 'animate-pulse' : ''}`} />
            <div className="flex-1">
              <p className="text-sm font-semibold text-green-900">Live Activity</p>
              <div className="text-xs text-green-700 space-y-1">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className={`transition-opacity duration-500 ${
                      showLiveActivity && index === 0 ? 'opacity-100' : 'opacity-70'
                    }`}
                  >
                    {activity}
                  </div>
                ))}
              </div>
            </div>
            <ArrowUp className="h-4 w-4 text-green-600 animate-bounce" />
          </div>
        </div>

        {/* Rotating testimonials */}
        <div className="rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex shrink-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
              ))}
            </div>
            <div className="flex-1 min-h-[3rem]">
              <p className="text-sm text-purple-900 transition-opacity duration-500">
                "{displayTestimonials[currentTestimonial]}"
              </p>
              <p className="text-xs text-purple-600 mt-2">
                - Verified Premium User
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion urgency bar */}
      <div className="rounded-xl bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200/50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
              <Heart className="h-4 w-4 text-white animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-semibold text-orange-900">
                Join {formatUserCount(Math.floor(userCount * 0.15))} users who upgraded today!
              </p>
              <p className="text-xs text-orange-700">
                Don't miss out on premium insights
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-red-600">{conversionRate}%</div>
            <div className="text-xs text-gray-600">Choose premium</div>
          </div>
        </div>

        {/* Progress bar showing conversion rate */}
        <div className="mt-3">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-2000 ease-out"
              style={{ width: `${conversionRate}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1 text-center">
            Most users upgrade within their first week
          </p>
        </div>
      </div>

      {/* Trust indicators */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/50 p-3 text-center">
          <div className="text-xl font-bold text-blue-900">10K+</div>
          <div className="text-xs text-blue-700">Meals analyzed daily</div>
        </div>

        <div className="rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 p-3 text-center">
          <div className="text-xl font-bold text-green-900">98%</div>
          <div className="text-xs text-green-700">User satisfaction</div>
        </div>
      </div>

      {/* Recent upgrade notifications */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-700 px-2">Recent Premium Upgrades:</p>
        <div className="space-y-1">
          {[
            "Sarah from NYC upgraded 2 minutes ago",
            "Mike from LA upgraded 5 minutes ago",
            "Emma from Chicago upgraded 8 minutes ago"
          ].map((notification, index) => (
            <div
              key={index}
              className={`
                rounded-lg bg-white/80 border border-green-200/50 p-2 text-xs text-gray-700
                transition-all duration-500 hover:bg-green-50
                ${index === 0 ? 'animate-pulse border-green-400' : ''}
              `}
            >
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                {notification}
                <div className="ml-auto text-green-600">✓</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
