'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function MealsPage() {
  const { user } = useAuth()
  const [meals, setMeals] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMeals = async () => {
      if (!user) return

      try {
        console.log('🔍 Fetching meals for user:', user.id)

        const { data, error } = await supabase
          .from('meals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Supabase error:', error)
          return
        }

        console.log('✅ Found meals:', data?.length || 0)
        console.log('📊 Sample meal:', data?.[0])
        setMeals(data || [])
      } catch (error) {
        console.error('Error fetching meals:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMeals()
  }, [user])

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white text-center mb-8">Your Meals 🍽️</h1>
        
        {isLoading ? (
          <div className="text-center text-white text-xl">Loading meals...</div>
        ) : meals.length === 0 ? (
          <div className="text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
              <h2 className="text-2xl text-white mb-4">No meals yet! 📸</h2>
              <p className="text-white/80 mb-6">Start capturing your delicious meals</p>
              <a 
                href="/camera" 
                className="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-pink-600 transition-all transform hover:scale-105"
              >
                📸 Capture Your First Meal
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            <p className="text-center text-white/80">Found {meals.length} meals</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {meals.map((meal) => (
                <div key={meal.id} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all">
                  <img 
                    src={meal.image_url} 
                    alt={meal.title || 'Meal'}
                    className="w-full h-48 object-cover rounded-xl mb-4 shadow-lg"
                    onError={(e) => {
                      e.target.style.display = 'none'
                    }}
                  />
                  <h3 className="text-white font-semibold text-lg mb-2">
                    {meal.title || 'Delicious Meal'}
                  </h3>
                  <p className="text-white/80 text-sm">
                    📅 {new Date(meal.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-white/60 text-xs mt-1">
                    🕒 {new Date(meal.created_at).toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
