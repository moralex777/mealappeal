'use client'

import { Crown, Heart, Star, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'

import { type ICelebrationProps } from '@/lib/types'

export function CelebrationAnimation({
  type,
  message,
  onComplete,
  intensity = 'moderate'
}: ICelebrationProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (intensity === 'explosive') {
      setShowConfetti(true)
    }

    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onComplete, 500)
    }, intensity === 'gentle' ? 2000 : intensity === 'moderate' ? 3000 : 5000)

    return () => clearTimeout(timer)
  }, [intensity, onComplete])

  const getIcon = () => {
    switch (type) {
      case 'streak':
        return <Zap className="h-12 w-12 text-orange-500" />
      case 'achievement':
        return <Star className="h-12 w-12 text-yellow-500" />
      case 'milestone':
        return <Crown className="h-12 w-12 text-purple-500" />
      case 'upgrade':
        return <Heart className="h-12 w-12 text-pink-500" />
      default:
        return <Star className="h-12 w-12 text-blue-500" />
    }
  }

  const getEmoji = () => {
    switch (type) {
      case 'streak':
        return '🔥'
      case 'achievement':
        return '🏆'
      case 'milestone':
        return '🎯'
      case 'upgrade':
        return '👑'
      default:
        return '✨'
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      {/* Confetti for explosive celebrations */}
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className={`absolute w-2 h-2 animate-bounce`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff'][Math.floor(Math.random() * 5)],
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Main celebration card */}
      <div
        className={`
          relative mx-4 max-w-md rounded-3xl border border-white/20
          bg-gradient-to-br from-white/90 to-white/70 p-8 shadow-2xl
          backdrop-blur-xl transition-all duration-700
          ${isVisible ? 'animate-pulse scale-100 opacity-100' : 'scale-95 opacity-0'}
          ${intensity === 'explosive' ? 'animate-bounce' : ''}
        `}
      >
        {/* Floating sparkles */}
        <div className="absolute -top-2 -left-2 h-4 w-4 animate-ping rounded-full bg-yellow-400" />
        <div className="absolute -top-1 -right-3 h-3 w-3 animate-ping rounded-full bg-pink-400" style={{ animationDelay: '0.5s' }} />
        <div className="absolute -bottom-2 -left-3 h-3 w-3 animate-ping rounded-full bg-blue-400" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-1 -right-2 h-4 w-4 animate-ping rounded-full bg-green-400" style={{ animationDelay: '1.5s' }} />

        {/* Main content */}
        <div className="text-center space-y-4">
          {/* Animated icon */}
          <div className="flex justify-center">
            <div className={`
              rounded-full p-4
              ${intensity === 'explosive' ? 'animate-spin' : 'animate-pulse'}
              bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600
            `}>
              {getIcon()}
            </div>
          </div>

          {/* Emoji burst */}
          <div className="text-6xl animate-bounce" style={{ animationDuration: '0.8s' }}>
            {getEmoji()}
          </div>

          {/* Success message */}
          <div className="space-y-2">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {message}
            </h3>
            <p className="text-sm text-gray-600">
              {type === 'streak' && 'Keep the momentum going! 🚀'}
              {type === 'achievement' && 'You\'re crushing your goals! 💪'}
              {type === 'milestone' && 'Another step towards greatness! ⭐'}
              {type === 'upgrade' && 'Welcome to the premium experience! 🎉'}
            </p>
          </div>

          {/* Progress ring animation */}
          <div className="flex justify-center">
            <div className="relative h-16 w-16">
              <svg className="h-16 w-16 transform -rotate-90" viewBox="0 0 32 32">
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="16"
                  cy="16"
                  r="14"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="88"
                  strokeDashoffset="0"
                  className="text-green-500 animate-pulse"
                  style={{
                    animation: 'progressRing 2s ease-in-out',
                  }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-green-600">100%</span>
              </div>
            </div>
          </div>

          {/* Call to action hint */}
          <div className="pt-2">
            <p className="text-xs text-gray-500 animate-pulse">
              Tap anywhere to continue your journey 🌟
            </p>
          </div>
        </div>
      </div>

      {/* Click anywhere to dismiss */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={() => {
          setIsVisible(false)
          setTimeout(onComplete, 500)
        }}
      />

      <style jsx>{`
        @keyframes progressRing {
          0% {
            stroke-dashoffset: 88;
          }
          100% {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  )
}
