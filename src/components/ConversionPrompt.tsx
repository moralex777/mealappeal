'use client'

import { AlertTriangle, Clock, Crown, Star, Users, X, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'

import { type IConversionPromptProps } from '@/lib/types'

export function ConversionPrompt({ trigger, profile, onDismiss, onUpgrade }: IConversionPromptProps) {
  const [timeLeft, setTimeLeft] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [pulseAnimation, setPulseAnimation] = useState(false)

  useEffect(() => {
    // Set up countdown timer for urgency triggers
    if (trigger.type === 'urgency' && timeLeft === 0) {
      setTimeLeft(3600) // 1 hour countdown
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0)
    }, 1000)

    // Pulse animation for high intensity prompts
    if (trigger.intensity === 'high') {
      setPulseAnimation(true)
      const pulseTimer = setInterval(() => {
        setPulseAnimation(prev => !prev)
      }, 1000)
      return () => {
        clearInterval(timer)
        clearInterval(pulseTimer)
      }
    }

    return () => clearInterval(timer)
  }, [trigger.type, trigger.intensity, timeLeft])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getPromptStyle = () => {
    switch (trigger.intensity) {
      case 'high':
        return {
          border: 'border-red-500/50',
          background: 'from-red-50 via-orange-50 to-yellow-50',
          textColor: 'text-red-900',
          buttonColor: 'from-red-500 to-orange-500',
        }
      case 'medium':
        return {
          border: 'border-orange-300/50',
          background: 'from-orange-50 via-yellow-50 to-amber-50',
          textColor: 'text-orange-900',
          buttonColor: 'from-orange-500 to-yellow-500',
        }
      default:
        return {
          border: 'border-blue-300/50',
          background: 'from-blue-50 via-indigo-50 to-purple-50',
          textColor: 'text-blue-900',
          buttonColor: 'from-blue-500 to-purple-500',
        }
    }
  }

  const getIcon = () => {
    switch (trigger.type) {
      case 'scarcity':
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />
      case 'urgency':
        return <Clock className="h-6 w-6 text-red-600" />
      case 'social_proof':
        return <Users className="h-6 w-6 text-blue-600" />
      case 'value_stack':
        return <Star className="h-6 w-6 text-purple-600" />
      case 'loss_aversion':
        return <Zap className="h-6 w-6 text-orange-600" />
      default:
        return <Crown className="h-6 w-6 text-gold-600" />
    }
  }

  const getSpecializedContent = () => {
    switch (trigger.type) {
      case 'scarcity':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-red-700">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
              <span className="font-semibold">Limited Time Offer</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white/80 rounded-lg p-2">
                <div className="text-lg font-bold text-red-600">87%</div>
                <div className="text-xs text-gray-600">Users upgrade</div>
              </div>
              <div className="bg-white/80 rounded-lg p-2">
                <div className="text-lg font-bold text-orange-600">24h</div>
                <div className="text-xs text-gray-600">Left to save</div>
              </div>
              <div className="bg-white/80 rounded-lg p-2">
                <div className="text-lg font-bold text-green-600">$10</div>
                <div className="text-xs text-gray-600">You save</div>
              </div>
            </div>
          </div>
        )

      case 'urgency':
        return (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-3xl font-mono font-bold text-red-600">
                {formatTime(timeLeft)}
              </div>
              <div className="text-sm text-red-700">Time remaining</div>
            </div>
            <div className="bg-red-100 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800">
                🚨 Your trial expires soon! Don't lose access to your {profile?.meal_count || 0} analyzed meals.
              </p>
            </div>
          </div>
        )

      case 'social_proof':
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 border-2 border-white" />
                ))}
              </div>
              <span className="text-sm text-gray-600">+10,000 others</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/80 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-blue-600">15%</div>
                <div className="text-xs text-gray-600">Upgrade today</div>
              </div>
              <div className="bg-white/80 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-green-600">4.9★</div>
                <div className="text-xs text-gray-600">User rating</div>
              </div>
            </div>
          </div>
        )

      case 'value_stack':
        return (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-purple-800 mb-2">What you get:</div>
            {[
              { feature: 'Unlimited AI Analysis', value: '$29/mo' },
              { feature: 'Advanced Nutrition Insights', value: '$19/mo' },
              { feature: 'Premium Community Access', value: '$15/mo' },
              { feature: 'Priority Support', value: '$10/mo' },
              { feature: 'Export & Sharing', value: '$9/mo' },
            ].map((item, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-gray-700">✓ {item.feature}</span>
                <span className="text-gray-500 line-through">{item.value}</span>
              </div>
            ))}
            <div className="border-t border-purple-200 pt-2 mt-2">
              <div className="flex justify-between items-center font-bold">
                <span className="text-purple-800">Total Value:</span>
                <div className="text-right">
                  <div className="text-gray-500 line-through text-sm">$82/mo</div>
                  <div className="text-green-600 text-lg">$4.99/mo</div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'loss_aversion':
        return (
          <div className="space-y-3">
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <span className="font-semibold text-yellow-800">Don't lose your progress!</span>
              </div>
              <div className="mt-2 space-y-1 text-sm text-yellow-700">
                <div>• {profile?.meal_count || 0} meals analyzed</div>
                <div>• Your nutrition insights</div>
                <div>• Streak progress</div>
                <div>• Community connections</div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.max(0, 14 - (profile?.meal_count || 0))} days
              </div>
              <div className="text-sm text-gray-600">Until deletion</div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  const style = getPromptStyle()

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div
        className={`
          relative max-w-md w-full rounded-2xl border ${style.border}
          bg-gradient-to-br ${style.background} p-6 shadow-2xl backdrop-blur-xl
          ${pulseAnimation ? 'animate-pulse' : ''}
          ${trigger.intensity === 'high' ? 'animate-bounce' : ''}
        `}
      >
        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 rounded-full p-2 text-gray-500 hover:bg-white/50 hover:text-gray-700 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`rounded-full p-3 bg-gradient-to-r ${style.buttonColor} shadow-lg`}>
            {getIcon()}
          </div>
          <div>
            <h3 className={`text-lg font-bold ${style.textColor}`}>
              {trigger.type === 'scarcity' && 'Limited Time!'}
              {trigger.type === 'urgency' && 'Act Fast!'}
              {trigger.type === 'social_proof' && 'Join Thousands!'}
              {trigger.type === 'value_stack' && 'Amazing Value!'}
              {trigger.type === 'loss_aversion' && 'Don\'t Lose Out!'}
            </h3>
            <p className="text-sm text-gray-600">Premium upgrade available</p>
          </div>
        </div>

        {/* Main message */}
        <div className="mb-4">
          <p className={`text-base font-semibold ${style.textColor} mb-3`}>
            {trigger.message}
          </p>

          {/* Specialized content */}
          {getSpecializedContent()}
        </div>

        {/* CTA buttons */}
        <div className="space-y-3">
          <button
            onClick={onUpgrade}
            className={`
              w-full rounded-xl bg-gradient-to-r ${style.buttonColor}
              px-6 py-4 text-white font-bold shadow-lg
              transform transition-all duration-200
              hover:scale-105 hover:shadow-xl
              ${trigger.intensity === 'high' ? 'animate-pulse' : ''}
            `}
          >
            <div className="flex items-center justify-center gap-2">
              <Crown className="h-5 w-5" />
              <span>{trigger.ctaText}</span>
              {trigger.type === 'urgency' && <span className="animate-ping">⚡</span>}
            </div>
          </button>

          {/* Secondary action */}
          <button
            onClick={onDismiss}
            className="w-full text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            {trigger.type === 'loss_aversion' ? 'I\'ll risk losing my data' : 'Maybe later'}
          </button>
        </div>

        {/* Trust signals */}
        <div className="mt-4 pt-4 border-t border-gray-200/50">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              Cancel anytime
            </span>
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              30-day guarantee
            </span>
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              Instant access
            </span>
          </div>
        </div>

        {/* Intensity-based visual effects */}
        {trigger.intensity === 'high' && (
          <>
            <div className="absolute -top-1 -left-1 h-4 w-4 rounded-full bg-red-500 animate-ping" />
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-orange-500 animate-ping" style={{ animationDelay: '0.5s' }} />
            <div className="absolute -bottom-1 -left-1 h-3 w-3 rounded-full bg-yellow-500 animate-ping" style={{ animationDelay: '1s' }} />
            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-red-500 animate-ping" style={{ animationDelay: '1.5s' }} />
          </>
        )}
      </div>
    </div>
  )
}
