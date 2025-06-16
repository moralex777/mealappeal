'use client'

import { ArrowLeft, Camera, Crown, Flame, Sparkles, Star, Trophy } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { AppLayout } from '@/components/AppLayout'
import { useAuth } from '@/contexts/AuthContext'

export default function AchievementsPage() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [streak, setStreak] = useState(1)
  const [totalMeals, setTotalMeals] = useState(0)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    // Get streak from localStorage for now
    const savedStreak = localStorage.getItem('mealappeal_streak')
    if (savedStreak) {
      setStreak(parseInt(savedStreak, 10))
    }

    // Use profile meal count
    if (profile?.meal_count) {
      setTotalMeals(profile.meal_count)
    }
  }, [user, profile, router])

  const achievements = [
    {
      id: 'first-meal',
      name: 'First Bite',
      description: 'Analyzed your first meal',
      icon: Camera,
      unlocked: totalMeals >= 1,
      color: 'from-green-500 to-emerald-500',
    },
    {
      id: 'week-warrior',
      name: 'Week Warrior',
      description: '7-day streak achieved',
      icon: Flame,
      unlocked: streak >= 7,
      color: 'from-orange-500 to-red-500',
    },
    {
      id: 'ten-meals',
      name: 'Meal Master',
      description: 'Analyzed 10 meals',
      icon: Star,
      unlocked: totalMeals >= 10,
      color: 'from-purple-500 to-indigo-500',
    },
    {
      id: 'month-streak',
      name: 'Consistency Champion',
      description: '30-day streak maintained',
      icon: Trophy,
      unlocked: streak >= 30,
      color: 'from-yellow-500 to-amber-500',
    },
  ]

  const nextMilestone = achievements.find(a => !a.unlocked) || achievements[achievements.length - 1]
  const unlockedCount = achievements.filter(a => a.unlocked).length

  return (
    <AppLayout>
      <div
        style={{
          minHeight: '100vh',
          background:
            'linear-gradient(135deg, #f9fafb 0%, #f3e8ff 25%, #fce7f3 50%, #fff7ed 75%, #f0fdf4 100%)',
          paddingBottom: '100px',
        }}
      >
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <button
              onClick={() => router.back()}
              style={{
                background: 'transparent',
                border: 'none',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#374151',
                fontSize: '16px',
                marginBottom: '16px',
              }}
            >
              <ArrowLeft style={{ width: '20px', height: '20px' }} />
              Back
            </button>

            <h1
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                background: 'linear-gradient(to right, #10b981, #ea580c)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '8px',
              }}
            >
              Your Achievements
            </h1>
            <p style={{ color: '#6b7280', fontSize: '16px' }}>
              Track your progress and unlock rewards
            </p>
          </div>

          {/* Current Streak Card */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '24px',
              padding: '24px',
              marginBottom: '24px',
              boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
              backdropFilter: 'blur(12px)',
              textAlign: 'center',
            }}
          >
            <Sparkles
              style={{
                width: '48px',
                height: '48px',
                margin: '0 auto 16px',
                color: '#ea580c',
              }}
              className="animate-streak-celebrate"
            />
            <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#1f2937' }}>
              {streak}
            </div>
            <div style={{ fontSize: '18px', color: '#6b7280', marginBottom: '16px' }}>
              Day Streak 🔥
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '24px',
                fontSize: '14px',
                color: '#6b7280',
              }}
            >
              <div>
                <div style={{ fontWeight: 'bold', color: '#1f2937' }}>{totalMeals}</div>
                <div>Total Meals</div>
              </div>
              <div>
                <div style={{ fontWeight: 'bold', color: '#1f2937' }}>{unlockedCount}</div>
                <div>Achievements</div>
              </div>
            </div>
          </div>

          {/* Progress to Next Achievement */}
          {!achievements.every(a => a.unlocked) && (
            <div
              style={{
                background: 'linear-gradient(135deg, #f3e8ff, #fce7f3)',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '24px',
                border: '2px solid rgba(255, 255, 255, 0.5)',
              }}
            >
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                Next Achievement
              </div>
              <div style={{ fontWeight: 'bold', color: '#1f2937' }}>
                {nextMilestone.name}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                {nextMilestone.description}
              </div>
            </div>
          )}

          {/* Achievements Grid */}
          <div style={{ display: 'grid', gap: '16px' }}>
            {achievements.map(achievement => {
              const Icon = achievement.icon
              return (
                <div
                  key={achievement.id}
                  style={{
                    background: achievement.unlocked
                      ? 'rgba(255, 255, 255, 0.95)'
                      : 'rgba(255, 255, 255, 0.6)',
                    borderRadius: '16px',
                    padding: '20px',
                    boxShadow: achievement.unlocked
                      ? '0 10px 20px rgba(0, 0, 0, 0.1)'
                      : 'none',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    backdropFilter: 'blur(12px)',
                    opacity: achievement.unlocked ? 1 : 0.6,
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: achievement.unlocked
                          ? `linear-gradient(135deg, ${achievement.color})`
                          : '#e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Icon
                        style={{
                          width: '24px',
                          height: '24px',
                          color: achievement.unlocked ? 'white' : '#9ca3af',
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 'bold',
                          color: achievement.unlocked ? '#1f2937' : '#6b7280',
                        }}
                      >
                        {achievement.name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#6b7280' }}>
                        {achievement.description}
                      </div>
                    </div>
                    {achievement.unlocked && (
                      <div style={{ fontSize: '24px' }}>✓</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Call to Action */}
          <div
            style={{
              marginTop: '32px',
              textAlign: 'center',
            }}
          >
            <Link href="/camera">
              <button
                style={{
                  background: 'linear-gradient(to right, #10b981, #ea580c)',
                  color: 'white',
                  padding: '16px 32px',
                  borderRadius: '16px',
                  border: 'none',
                  fontSize: '18px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 8px 15px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 12px 20px rgba(16, 185, 129, 0.4)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = '0 8px 15px rgba(16, 185, 129, 0.3)'
                }}
              >
                Keep Your Streak Going! 📸
              </button>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}