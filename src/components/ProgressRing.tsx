'use client'

import { useEffect, useState } from 'react'

import { type IProgressRingProps } from '@/lib/types'

export function ProgressRing({
  progress,
  size = 'md',
  color = 'blue',
  showLabel = true,
  animationDuration = 1000,
}: IProgressRingProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const sizeConfig = {
    sm: { dimension: 'h-12 w-12', strokeWidth: 3, radius: 18, fontSize: 'text-xs' },
    md: { dimension: 'h-16 w-16', strokeWidth: 4, radius: 24, fontSize: 'text-sm' },
    lg: { dimension: 'h-24 w-24', strokeWidth: 6, radius: 36, fontSize: 'text-base' },
  }

  const colorConfig = {
    blue: { from: '#3b82f6', to: '#1d4ed8', text: 'text-blue-600' },
    green: { from: '#10b981', to: '#047857', text: 'text-green-600' },
    orange: { from: '#f97316', to: '#ea580c', text: 'text-orange-600' },
    purple: { from: '#8b5cf6', to: '#7c3aed', text: 'text-purple-600' },
    red: { from: '#ef4444', to: '#dc2626', text: 'text-red-600' },
    yellow: { from: '#eab308', to: '#ca8a04', text: 'text-yellow-600' },
    pink: { from: '#ec4899', to: '#db2777', text: 'text-pink-600' },
  }

  const config = sizeConfig[size]
  const colors = colorConfig[color as keyof typeof colorConfig] || colorConfig.blue

  const circumference = 2 * Math.PI * config.radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference

  useEffect(() => {
    setIsAnimating(true)
    const timer = setTimeout(() => {
      setAnimatedProgress(progress)
      setTimeout(() => setIsAnimating(false), animationDuration)
    }, 100)

    return () => clearTimeout(timer)
  }, [progress, animationDuration])

  const getProgressLabel = () => {
    if (progress === 100) return '🎉'
    if (progress >= 75) return '🔥'
    if (progress >= 50) return '⭐'
    if (progress >= 25) return '💪'
    return '🌱'
  }

  return (
    <div className={`relative ${config.dimension}`}>
      {/* Background circle */}
      <svg
        className={`${config.dimension} transform -rotate-90`}
        viewBox={`0 0 ${config.radius * 2 + config.strokeWidth * 2} ${config.radius * 2 + config.strokeWidth * 2}`}
      >
        <defs>
          <linearGradient id={`gradient-${color}-${size}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.from} />
            <stop offset="100%" stopColor={colors.to} />
          </linearGradient>

          {/* Glow effect for completed states */}
          {progress >= 100 && (
            <filter id={`glow-${color}-${size}`}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          )}
        </defs>

        {/* Background circle */}
        <circle
          cx={config.radius + config.strokeWidth}
          cy={config.radius + config.strokeWidth}
          r={config.radius}
          stroke="currentColor"
          strokeWidth={config.strokeWidth}
          fill="none"
          className="text-gray-200"
        />

        {/* Progress circle */}
        <circle
          cx={config.radius + config.strokeWidth}
          cy={config.radius + config.strokeWidth}
          r={config.radius}
          stroke={`url(#gradient-${color}-${size})`}
          strokeWidth={config.strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className={`transition-all duration-${animationDuration} ease-out ${
            progress >= 100 ? `filter: url(#glow-${color}-${size})` : ''
          }`}
          style={{
            transitionDuration: `${animationDuration}ms`,
          }}
        />

        {/* Pulsing dot at progress end for active states */}
        {isAnimating && animatedProgress > 0 && (
          <circle
            cx={
              config.radius + config.strokeWidth +
              config.radius * Math.cos((animatedProgress / 100) * 2 * Math.PI - Math.PI / 2)
            }
            cy={
              config.radius + config.strokeWidth +
              config.radius * Math.sin((animatedProgress / 100) * 2 * Math.PI - Math.PI / 2)
            }
            r={config.strokeWidth / 2}
            fill={colors.to}
            className="animate-ping"
          />
        )}
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {showLabel && (
          <div className="text-center">
            {progress >= 100 ? (
              <div className={`${config.fontSize} animate-bounce`}>
                {getProgressLabel()}
              </div>
            ) : (
              <>
                <div className={`font-bold ${colors.text} ${config.fontSize}`}>
                  {Math.round(animatedProgress)}%
                </div>
                {size === 'lg' && (
                  <div className="text-xs text-gray-500 mt-1">
                    {getProgressLabel()}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Completion sparkles */}
      {progress >= 100 && (
        <>
          <div className="absolute -top-1 -left-1 h-2 w-2 rounded-full bg-yellow-400 animate-ping" />
          <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-blue-400 animate-ping" style={{ animationDelay: '0.5s' }} />
          <div className="absolute -bottom-1 -left-1 h-2 w-2 rounded-full bg-green-400 animate-ping" style={{ animationDelay: '1s' }} />
          <div className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-pink-400 animate-ping" style={{ animationDelay: '1.5s' }} />
        </>
      )}

      {/* Micro-interaction feedback */}
      {isAnimating && (
        <div className="absolute inset-0 rounded-full bg-white/10 animate-pulse" />
      )}
    </div>
  )
}
