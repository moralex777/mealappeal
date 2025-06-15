'use client'

import { useAuth } from '@/contexts/AuthContext'
import { 
  Clock, 
  Crown, 
  Eye, 
  Lock, 
  Sparkles, 
  Star, 
  Target, 
  TrendingUp, 
  Trophy, 
  Unlock, 
  Users, 
  Zap 
} from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

interface ConversionTriggerProps {
  triggerType: 'feature_limit' | 'analysis_preview' | 'usage_milestone' | 'social_proof' | 'time_sensitive' | 'value_demonstration' | 'yearly_savings'
  context?: {
    featureName?: string
    previewContent?: string
    milestone?: number
    userCount?: number
    timeLeft?: string
    savings?: string
  }
  className?: string
  onDismiss?: () => void
}

export default function ConversionTrigger({ 
  triggerType, 
  context = {}, 
  className = '',
  onDismiss 
}: ConversionTriggerProps) {
  const { profile } = useAuth()
  const [isVisible, setIsVisible] = useState(true)
  const [, setHasInteracted] = useState(false)

  const isPremium = profile?.subscription_tier === 'premium_monthly' || profile?.subscription_tier === 'premium_yearly'

  // Don't show triggers to premium users
  if (isPremium) return null

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  const handleUpgradeClick = () => {
    setHasInteracted(true)
    // Track conversion trigger interaction
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'upgrade_trigger_click', {
        trigger_type: triggerType,
        context: JSON.stringify(context),
      })
    }
  }

  if (!isVisible) return null

  const renderTrigger = () => {
    switch (triggerType) {
      case 'feature_limit':
        return (
          <div className="glass-card border-l-4 border-amber-400 overflow-hidden rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <Lock className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="mb-2 font-semibold text-gray-900">
                  {context.featureName} is Premium Only
                </h3>
                <p className="mb-4 text-sm text-gray-600">
                  You've discovered an amazing feature! Upgrade to unlock {context.featureName} and 5 other powerful analysis modes.
                </p>
                <div className="flex items-center gap-3">
                  <Link href="/upgrade">
                    <button 
                      onClick={handleUpgradeClick}
                      className="btn-premium text-sm"
                    >
                      <Crown className="h-4 w-4" />
                      Unlock Now - $4.99/mo
                    </button>
                  </Link>
                  <button 
                    onClick={handleDismiss}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'analysis_preview':
        return (
          <div className="glass-card gradient-purple-500-pink-500 overflow-hidden rounded-2xl p-6 text-white">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <Eye className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">Premium Preview</h3>
            </div>
            <div className="mb-4 glass-effect rounded-lg p-3 bg-white/10">
              <p className="text-sm opacity-90">
                {context.previewContent || "This is just a taste of what premium analysis reveals..."}
              </p>
            </div>
            <p className="mb-4 text-sm opacity-90">
              See the complete analysis with scientific insights, cultural background, and personalized recommendations.
            </p>
            <div className="flex items-center gap-3">
              <Link href="/upgrade">
                <button 
                  onClick={handleUpgradeClick}
                  className="glass-effect rounded-xl border-2 border-white/30 bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur-xl transition-all hover:scale-105 hover:bg-white/30"
                >
                  <Unlock className="mr-2 h-4 w-4" />
                  Unlock Full Analysis
                </button>
              </Link>
              <button 
                onClick={handleDismiss}
                className="text-sm opacity-75 hover:opacity-100"
              >
                Not now
              </button>
            </div>
          </div>
        )

      case 'usage_milestone':
        return (
          <div className="glass-card gradient-green-500-emerald-500 overflow-hidden rounded-2xl p-6 text-white">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">🎉 Milestone Achieved!</h3>
            </div>
            <p className="mb-4 text-sm opacity-90">
              You've analyzed {context.milestone} meals! You're clearly serious about your nutrition journey.
            </p>
            <p className="mb-4 text-sm opacity-90">
              Ready to unlock deeper insights that help you optimize every meal?
            </p>
            <div className="flex items-center gap-3">
              <Link href="/upgrade">
                <button 
                  onClick={handleUpgradeClick}
                  className="glass-effect rounded-xl border-2 border-white/30 bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur-xl transition-all hover:scale-105 hover:bg-white/30"
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  Celebrate with Premium
                </button>
              </Link>
              <button 
                onClick={handleDismiss}
                className="text-sm opacity-75 hover:opacity-100"
              >
                Continue free
              </button>
            </div>
          </div>
        )

      case 'social_proof':
        return (
          <div className="glass-card border-l-4 border-blue-400 overflow-hidden rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="mb-2 font-semibold text-gray-900">
                  Join {context.userCount?.toLocaleString()} Happy Users
                </h3>
                <p className="mb-4 text-sm text-gray-600">
                  Premium users are seeing amazing results with detailed nutrition insights and personalized recommendations.
                </p>
                <div className="mb-4 flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                  <span className="text-sm font-medium text-gray-700">4.9/5 from users</span>
                </div>
                <div className="flex items-center gap-3">
                  <Link href="/upgrade">
                    <button 
                      onClick={handleUpgradeClick}
                      className="btn-primary text-sm"
                    >
                      <TrendingUp className="h-4 w-4" />
                      Join Premium Community
                    </button>
                  </Link>
                  <button 
                    onClick={handleDismiss}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Stay free
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'time_sensitive':
        return (
          <div className="glass-card gradient-amber-500-orange-500 overflow-hidden rounded-2xl p-6 text-white">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">⏰ Limited Time Offer</h3>
            </div>
            <p className="mb-2 text-lg font-bold">Save 17% with Annual Plan</p>
            <p className="mb-4 text-sm opacity-90">
              Get premium features for less than a coffee per week. Offer expires in {context.timeLeft}.
            </p>
            <div className="flex items-center gap-3">
              <Link href="/upgrade">
                <button 
                  onClick={handleUpgradeClick}
                  className="glass-effect rounded-xl border-2 border-white/30 bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur-xl transition-all hover:scale-105 hover:bg-white/30"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Save {context.savings} Now
                </button>
              </Link>
              <button 
                onClick={handleDismiss}
                className="text-sm opacity-75 hover:opacity-100"
              >
                Skip offer
              </button>
            </div>
          </div>
        )

      case 'value_demonstration':
        return (
          <div className="glass-card gradient-appetite overflow-hidden rounded-2xl p-6 text-white">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">Unlock Your Food's Secrets</h3>
            </div>
            <div className="mb-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-white/60"></div>
                <span>6 analysis modes worth $200+ in consulting</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-white/60"></div>
                <span>Unlimited meal storage (vs 14-day free limit)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-white/60"></div>
                <span>Export reports for your healthcare team</span>
              </div>
            </div>
            <p className="mb-4 text-sm opacity-90">
              All for less than the cost of one nutritionist session.
            </p>
            <div className="flex items-center gap-3">
              <Link href="/upgrade">
                <button 
                  onClick={handleUpgradeClick}
                  className="glass-effect rounded-xl border-2 border-white/30 bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur-xl transition-all hover:scale-105 hover:bg-white/30"
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Start Premium Journey
                </button>
              </Link>
              <button 
                onClick={handleDismiss}
                className="text-sm opacity-75 hover:opacity-100"
              >
                Continue basic
              </button>
            </div>
          </div>
        )

      case 'yearly_savings':
        return (
          <div className="glass-card gradient-gold overflow-hidden rounded-3xl p-6 text-amber-900">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <Crown className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold">💎 Premium Annual - Best Value!</h3>
            </div>
            
            <div className="mb-4 glass-effect bg-white/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold">$49.99/year</span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-bold">Save 17%</span>
              </div>
              <div className="text-sm opacity-80">vs $59.88 for monthly plan</div>
              <div className="text-xs opacity-70">That's only $4.17/month - less than a coffee!</div>
            </div>

            <div className="mb-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-amber-600"></div>
                <span>All 6 analysis modes unlocked</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-amber-600"></div>
                <span>Unlimited meal storage & sharing</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-amber-600"></div>
                <span>Priority support & early access features</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-amber-600"></div>
                <span>Export reports for healthcare teams</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/upgrade" className="flex-1">
                <button 
                  onClick={handleUpgradeClick}
                  className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 px-6 py-3 font-bold text-white transition-all hover:scale-105 shadow-lg"
                >
                  🎉 Get Annual Plan
                </button>
              </Link>
              <button 
                onClick={handleDismiss}
                className="text-sm opacity-75 hover:opacity-100"
              >
                Skip
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={`animate-fade-in-up ${className}`}>
      {renderTrigger()}
    </div>
  )
}

// Hook for strategic trigger timing
export function useConversionTriggers() {
  const { profile } = useAuth()
  const [triggers, setTriggers] = useState<Array<{ id: string; type: string; context: any }>>([])
  
  const isPremium = profile?.subscription_tier === 'premium_monthly' || profile?.subscription_tier === 'premium_yearly'

  const addTrigger = (type: string, context: any = {}) => {
    if (isPremium) return // Don't show triggers to premium users
    
    const id = `${type}_${Date.now()}`
    setTriggers(prev => [...prev, { id, type, context }])
  }

  const removeTrigger = (id: string) => {
    setTriggers(prev => prev.filter(trigger => trigger.id !== id))
  }

  // Auto-trigger based on user behavior
  useEffect(() => {
    if (isPremium) return

    const mealCount = profile?.meal_count || 0
    
    // Milestone triggers
    if (mealCount === 5) {
      setTimeout(() => {
        addTrigger('usage_milestone', { milestone: 5 })
      }, 2000)
    }
    
    if (mealCount === 10) {
      setTimeout(() => {
        addTrigger('social_proof', { userCount: 12000 })
      }, 3000)
    }

    if (mealCount === 20) {
      setTimeout(() => {
        addTrigger('value_demonstration', {})
      }, 2000)
    }

    // Show yearly savings trigger for engaged users
    if (mealCount === 15) {
      setTimeout(() => {
        addTrigger('yearly_savings', {})
      }, 3000)
    }
  }, [profile?.meal_count, isPremium])

  return {
    triggers,
    addTrigger,
    removeTrigger,
  }
}