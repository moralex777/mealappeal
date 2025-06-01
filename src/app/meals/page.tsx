'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Camera, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'

interface Meal {
  id: string
  title: string
  image_url: string
  ai_confidence_score: number
  scheduled_deletion_date: string
  created_at: string
  basic_nutrition?: {
    energy_kcal: number
    protein_g: number
    carbs_g: number
    fat_g: number
  }
  premium_nutrition?: {
    fiber_g: number
    sodium_mg: number
    sugar_g: number
    saturated_fat_g: number
    cholesterol_mg: number
    potassium_mg: number
  }
  health_score?: number
  meal_tags?: string[]
}

export default function MealsPage() {
  const { user, profile } = useAuth()
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchMeals()
    }
  }, [user])

  const fetchMeals = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setMeals(data || [])
    } catch (err) {
      console.error('Error fetching meals:', err)
      setError('😅 Oops! We had trouble loading your amazing meals')
    } finally {
      setLoading(false)
    }
  }

  const getDaysLeft = (deletionDate: string) => {
    if (!deletionDate || profile?.subscription_tier === 'premium') return 'Unlimited'
    const deletion = new Date(deletionDate)
    const now = new Date()
    const diffTime = deletion.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'numeric', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  // Get minimum days left across all meals for stats display
  const getMinDaysLeft = () => {
    if (profile?.subscription_tier === 'premium') return 'Unlimited'
    if (meals.length === 0) return '14'
    
    const daysLeftArray = meals.map(meal => {
      const daysLeft = getDaysLeft(meal.scheduled_deletion_date)
      return typeof daysLeft === 'number' ? daysLeft : 14
    }).filter(days => typeof days === 'number')
    
    return daysLeftArray.length > 0 ? Math.min(...daysLeftArray) : '14'
  }

  // 🎯 BACKFILL NUTRITION DATA FOR OLD MEALS
  const getDisplayNutrition = (meal: Meal) => {
    if (meal.basic_nutrition && meal.basic_nutrition.energy_kcal > 0) {
      return {
        energy_kcal: meal.basic_nutrition.energy_kcal,
        protein_g: meal.basic_nutrition.protein_g,
        carbs_g: meal.basic_nutrition.carbs_g,
        fat_g: meal.basic_nutrition.fat_g
      }
    }
    
    // FALLBACK: Generate reasonable nutrition estimates based on meal type
    const mealTitle = meal.title.toLowerCase()
    
    if (mealTitle.includes('apple')) {
      return { energy_kcal: 95, protein_g: 0.5, carbs_g: 25, fat_g: 0.3 }
    } else if (mealTitle.includes('sandwich')) {
      return { energy_kcal: 350, protein_g: 15, carbs_g: 45, fat_g: 12 }
    } else if (mealTitle.includes('pizza')) {
      return { energy_kcal: 285, protein_g: 12, carbs_g: 36, fat_g: 10 }
    } else if (mealTitle.includes('salad')) {
      return { energy_kcal: 150, protein_g: 8, carbs_g: 12, fat_g: 9 }
    } else if (mealTitle.includes('banana')) {
      return { energy_kcal: 105, protein_g: 1.3, carbs_g: 27, fat_g: 0.4 }
    } else {
      return { energy_kcal: 250, protein_g: 10, carbs_g: 30, fat_g: 8 }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 to-orange-50 p-4">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">🍽️ Loading your amazing food journey...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 to-orange-50 p-4">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center py-20">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchMeals}
              className="px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transform hover:scale-105 transition-all"
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-orange-50 p-4">
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold gradient-text">🍽️ YOUR FOOD JOURNEY</h1>
            <Link 
              href="/camera"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-600 to-orange-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all"
            >
              <Camera className="w-4 h-4" />
              📸 Capture Magic
            </Link>
          </div>
          
          {/* Stats Section with Perfect Spacing */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg mb-4">
            <div className="font-bold text-xl mb-4">🍽️ YOUR FOOD JOURNEY</div>
            
            <div className="h-4"></div> {/* Space line */}
            
            <div className="space-y-2 text-lg">
              <div>📸 Meals Captured So Far: <span className="font-semibold text-brand-600">{meals.length}</span></div>
              <div>📤 Monthly Shares Left: <span className="font-semibold text-orange-600">{3 - (profile?.monthly_shares_used || 0)}/3</span></div>
              <div>⏳ Storage Days Left: <span className="font-semibold text-brand-600">{getMinDaysLeft()}</span></div>
              <div>🌱 Subscription: <span className="font-semibold text-gray-600">{profile?.subscription_tier?.toUpperCase() || 'FREE'}</span></div>
            </div>
          </div>

          {/* Free Tier Message */}
          {profile?.subscription_tier === 'free' && (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <div className="text-sm text-yellow-800 mb-3">
                <strong>🌱 Free Subscription:</strong> You currently get basic nutrition details only. 
                For more amazing insights, advanced nutrition analysis, and unlimited storage, upgrade to Premium!
              </div>
              <button className="bg-gradient-to-r from-brand-600 to-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transform hover:scale-105 transition-all text-sm">
                🚀 Upgrade Now - $4.99/month
              </button>
            </div>
          )}
        </div>

        {/* Meals Grid */}
        {meals.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold mb-2">Your food adventure awaits!</h3>
            <p className="text-muted-foreground mb-6">Start by capturing your first delicious meal 📸</p>
            <Link 
              href="/camera"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-600 to-orange-600 text-white rounded-lg hover:shadow-lg transform hover:scale-105 transition-all"
            >
              <Camera className="w-4 h-4" />
              🚀 Start Your Journey
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meals.map((meal) => {
              const nutrition = getDisplayNutrition(meal)
              const daysLeft = getDaysLeft(meal.scheduled_deletion_date)
              
              return (
                <div key={meal.id} className="bg-white/80 backdrop-blur-sm rounded-xl overflow-hidden border border-white/20 hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300">
                  {/* Image */}
                  <div className="aspect-square relative bg-gray-100">
                    {meal.image_url ? (
                      <img 
                        src={meal.image_url} 
                        alt={meal.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik05MCA2MEg2MEw5MCA5MEw2MCA5MEw5MCA2MFoiIGZpbGw9IiM5Q0E0QTMiLz4KPC9zdmc+'
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <Camera className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Content with Perfect Spacing */}
                  <div className="p-4">
                    {/* Meal Title */}
                    <div className="font-bold text-lg">{meal.title}</div>
                    
                    {/* Space line */}
                    <div className="h-4"></div>
                    
                    {/* Confidence and Health Score */}
                    <div className="space-y-1 text-sm">
                      <div>✨ Confidence: <span className="font-semibold">{Math.round(meal.ai_confidence_score * 100)}%</span></div>
                      {meal.health_score && (
                        <div>🎯 Health Score: <span className="font-semibold">{meal.health_score}/10</span></div>
                      )}
                    </div>
                    
                    {/* Space line */}
                    <div className="h-4"></div>
                    
                    {/* Basic Nutrition Header */}
                    <div className="font-bold text-sm text-brand-600">📊 BASIC NUTRITION BREAKDOWN</div>
                    
                    {/* Space line */}
                    <div className="h-4"></div>
                    
                    {/* Nutrition Data */}
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>⚡ Energy: {nutrition.energy_kcal} kcal</div>
                      <div>🥩 Protein: {nutrition.protein_g}g</div>
                      <div>🍞 Carbs: {nutrition.carbs_g}g</div>
                      <div>🧈 Fat: {nutrition.fat_g}g</div>
                    </div>

                    {/* Space line */}
                    <div className="h-4"></div>

                    {/* Date and Storage Info */}
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>📅 When Analyzed: {formatDate(meal.created_at)}</div>
                      <div className={
                        daysLeft === 'Unlimited' 
                          ? 'text-green-600 font-medium' 
                          : typeof daysLeft === 'number' && daysLeft <= 3 
                            ? 'text-red-500 font-medium' 
                            : ''
                      }>
                        ⏳ Storage: {daysLeft === 'Unlimited' ? 'Unlimited' : `${daysLeft} days left`}
                      </div>
                    </div>

                    {/* Urgency Warning for Free Users */}
                    {profile?.subscription_tier === 'free' && typeof daysLeft === 'number' && daysLeft <= 3 && daysLeft > 0 && (
                      <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-xs text-red-700 font-medium">⚠️ Expiring Soon!</div>
                        <div className="text-xs text-red-600">Upgrade to save forever</div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Engagement Footer */}
        <div className="mt-8 text-center text-muted-foreground">
          <p className="text-sm">🎉 {meals.length} meals analyzed • Keep building your food story!</p>
        </div>
      </div>
    </div>
  )
}