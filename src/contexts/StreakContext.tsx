'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useAuth } from './AuthContext'

interface StreakContextType {
  streak: number
  lastMealDate: string | null
  mealsToday: number
  updateStreak: () => void
  checkAndUpdateStreak: () => void
}

const StreakContext = createContext<StreakContextType | undefined>(undefined)

export function StreakProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth()
  const [streak, setStreak] = useState(1)
  const [lastMealDate, setLastMealDate] = useState<string | null>(null)
  const [mealsToday, setMealsToday] = useState(0)

  useEffect(() => {
    if (user) {
      loadStreakData()
    }
  }, [user])

  const loadStreakData = () => {
    // Load from localStorage
    const savedStreak = localStorage.getItem('mealappeal_streak')
    const savedLastDate = localStorage.getItem('mealappeal_last_meal_date')
    const savedMealsToday = localStorage.getItem('mealappeal_meals_today')

    if (savedStreak) setStreak(parseInt(savedStreak, 10))
    if (savedLastDate) setLastMealDate(savedLastDate)
    if (savedMealsToday) {
      const todayData = JSON.parse(savedMealsToday)
      const today = new Date().toDateString()
      if (todayData.date === today) {
        setMealsToday(todayData.count)
      } else {
        // Reset for new day
        setMealsToday(0)
        localStorage.setItem('mealappeal_meals_today', JSON.stringify({ date: today, count: 0 }))
      }
    }

    // Check if streak should be reset
    checkAndUpdateStreak()
  }

  const checkAndUpdateStreak = () => {
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    
    if (lastMealDate) {
      if (lastMealDate !== today && lastMealDate !== yesterday) {
        // Streak broken - reset to 0
        setStreak(0)
        localStorage.setItem('mealappeal_streak', '0')
      }
    }
  }

  const updateStreak = () => {
    const today = new Date().toDateString()
    
    // Update meals today count
    const newMealsToday = mealsToday + 1
    setMealsToday(newMealsToday)
    localStorage.setItem('mealappeal_meals_today', JSON.stringify({ date: today, count: newMealsToday }))

    // Update streak
    if (lastMealDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString()
      
      let newStreak = streak
      if (lastMealDate === yesterday) {
        // Continuing streak
        newStreak = streak + 1
      } else if (!lastMealDate || lastMealDate !== today) {
        // Starting new streak
        newStreak = 1
      }

      setStreak(newStreak)
      setLastMealDate(today)
      localStorage.setItem('mealappeal_streak', newStreak.toString())
      localStorage.setItem('mealappeal_last_meal_date', today)

      // Trigger celebration animation if milestone
      if ([7, 14, 30, 60, 100].includes(newStreak)) {
        // Could dispatch an event here for celebration animation
        console.log(`🎉 Milestone reached: ${newStreak} day streak!`)
      }
    }
  }

  return (
    <StreakContext.Provider value={{ streak, lastMealDate, mealsToday, updateStreak, checkAndUpdateStreak }}>
      {children}
    </StreakContext.Provider>
  )
}

export function useStreak() {
  const context = useContext(StreakContext)
  if (context === undefined) {
    throw new Error('useStreak must be used within a StreakProvider')
  }
  return context
}