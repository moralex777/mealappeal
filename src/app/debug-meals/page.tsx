'use client'

import { useEffect, useState } from 'react'

import { getSupabase } from '@/lib/supabase'

export default function DebugMealsPage() {
  const [meals, setMeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    console.log(message)
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    const fetchMeals = async () => {
      try {
        setLoading(true)
        addLog('🔄 Starting debug...')

        const supabase = await getSupabase()
        addLog('✅ Supabase client created')

        // Check if we're already authenticated
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          addLog(`✅ Already authenticated as: ${session.user.email}`)

          // Fetch meals directly
          const { data: mealsData, error: mealsError } = await supabase
            .from('meals')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(5)

          if (mealsError) {
            throw new Error(`Meals fetch failed: ${mealsError.message}`)
          }

          addLog(`✅ Fetched ${mealsData.length} meals from existing session`)
          setMeals(mealsData)
        } else {
          addLog('ℹ️ No existing session, attempting login...')

          // Try to authenticate
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: 'alex@propertytalents.com',
            password: 'Alex.1234',
          })

          if (authError) {
            throw new Error(`Auth failed: ${authError.message}`)
          }

          addLog(`✅ Authenticated: ${authData.user.email}`)

          // Fetch meals
          const { data: mealsData, error: mealsError } = await supabase
            .from('meals')
            .select('*')
            .eq('user_id', authData.user.id)
            .order('created_at', { ascending: false })
            .limit(5)

          if (mealsError) {
            throw new Error(`Meals fetch failed: ${mealsError.message}`)
          }

          addLog(`✅ Fetched ${mealsData.length} meals`)
          setMeals(mealsData)
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        addLog(`❌ Error: ${errorMsg}`)
        setError(errorMsg)
      } finally {
        setLoading(false)
        addLog('🏁 Debug complete')
      }
    }

    fetchMeals()
  }, [])

  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">🍽️ Debug Meals</h1>

      {/* Debug Logs */}
      <div className="mb-6 rounded-lg bg-gray-100 p-4">
        <h2 className="mb-2 font-bold">📋 Debug Logs:</h2>
        <div className="space-y-1 font-mono text-sm">
          {logs.map((log, index) => (
            <div key={index} className="text-gray-700">
              {log}
            </div>
          ))}
        </div>
      </div>

      {loading && (
        <div className="mb-4 flex items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
          <span>Loading...</span>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-100 p-4 text-red-700">
          <h2 className="font-bold">❌ Error:</h2>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div>
          <h2 className="mb-4 text-xl font-bold">📊 Results: {meals.length} meals found</h2>

          {meals.length === 0 ? (
            <p className="text-gray-600">No meals found in database</p>
          ) : (
            <div className="space-y-4">
              {meals.map((meal, index) => (
                <div key={meal.id} className="rounded-lg border bg-white p-4 shadow">
                  <h3 className="text-lg font-bold">
                    {index + 1}. {meal.title || 'No title'}
                  </h3>
                  <p className="text-gray-600">
                    📅 {new Date(meal.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500">🆔 {meal.id}</p>
                  {meal.basic_nutrition && (
                    <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                      <p>🔥 Calories: {meal.basic_nutrition.energy_kcal}</p>
                      <p>💪 Protein: {meal.basic_nutrition.protein_g}g</p>
                      <p>🌾 Carbs: {meal.basic_nutrition.carbs_g}g</p>
                      <p>🥑 Fat: {meal.basic_nutrition.fat_g}g</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-8 space-x-4">
        <a href="/meals" className="text-blue-600 hover:underline">
          ← Back to main meals page
        </a>
        <button
          onClick={() => window.location.reload()}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          🔄 Refresh Debug
        </button>
      </div>
    </div>
  )
}
