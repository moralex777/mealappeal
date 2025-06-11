'use client'

import { useCallback, useEffect, useState } from 'react'

interface AnalysisData {
  [key: string]: any
}

interface CacheEntry {
  data: AnalysisData
  timestamp: number
  mealId: string
}

interface UseAnalysisCacheResult {
  getCachedAnalysis: (mealId: string, mode: string) => AnalysisData | null
  setCachedAnalysis: (mealId: string, mode: string, data: AnalysisData) => void
  isCached: (mealId: string, mode: string) => boolean
  clearCache: () => void
  getCacheSize: () => number
  preloadAnalysis: (mealId: string, mode: string) => Promise<AnalysisData>
}

const CACHE_DURATION = 30 * 60 * 1000 // 30 minutes
const MAX_CACHE_SIZE = 50 // Maximum number of cached analyses
const CACHE_KEY = 'mealappeal_analysis_cache'

export function useAnalysisCache(): UseAnalysisCacheResult {
  const [cache, setCache] = useState<Record<string, CacheEntry>>({})

  // Load cache from localStorage on mount
  useEffect(() => {
    try {
      const savedCache = localStorage.getItem(CACHE_KEY)
      if (savedCache) {
        const parsedCache = JSON.parse(savedCache)
        const now = Date.now()
        
        // Filter out expired entries
        const validCache = Object.entries(parsedCache).reduce((acc, [key, entry]) => {
          const cacheEntry = entry as CacheEntry
          if (now - cacheEntry.timestamp < CACHE_DURATION) {
            acc[key] = cacheEntry
          }
          return acc
        }, {} as Record<string, CacheEntry>)
        
        setCache(validCache)
      }
    } catch (error) {
      console.error('Error loading analysis cache:', error)
    }
  }, [])

  // Save cache to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
    } catch (error) {
      console.error('Error saving analysis cache:', error)
    }
  }, [cache])

  const getCacheKey = useCallback((mealId: string, mode: string) => {
    return `${mealId}_${mode}`
  }, [])

  const getCachedAnalysis = useCallback((mealId: string, mode: string): AnalysisData | null => {
    const key = getCacheKey(mealId, mode)
    const entry = cache[key]
    
    if (!entry) return null
    
    // Check if entry is still valid
    const now = Date.now()
    if (now - entry.timestamp > CACHE_DURATION) {
      // Remove expired entry
      setCache(prev => {
        const newCache = { ...prev }
        delete newCache[key]
        return newCache
      })
      return null
    }
    
    return entry.data
  }, [cache, getCacheKey])

  const setCachedAnalysis = useCallback((mealId: string, mode: string, data: AnalysisData) => {
    const key = getCacheKey(mealId, mode)
    const now = Date.now()
    
    setCache(prev => {
      const newCache = { ...prev }
      
      // If cache is getting too large, remove oldest entries
      const entries = Object.entries(newCache)
      if (entries.length >= MAX_CACHE_SIZE) {
        // Sort by timestamp and remove oldest
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
        const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE + 1)
        toRemove.forEach(([oldKey]) => {
          delete newCache[oldKey]
        })
      }
      
      newCache[key] = {
        data,
        timestamp: now,
        mealId,
      }
      
      return newCache
    })
  }, [getCacheKey])

  const isCached = useCallback((mealId: string, mode: string): boolean => {
    return getCachedAnalysis(mealId, mode) !== null
  }, [getCachedAnalysis])

  const clearCache = useCallback(() => {
    setCache({})
    try {
      localStorage.removeItem(CACHE_KEY)
    } catch (error) {
      console.error('Error clearing analysis cache:', error)
    }
  }, [])

  const getCacheSize = useCallback(() => {
    return Object.keys(cache).length
  }, [cache])

  // Simulated API call for analysis data
  const generateAnalysisData = useCallback((mealId: string, mode: string): AnalysisData => {
    // This would normally be an API call to your backend
    // For now, we'll generate mock data based on the mode
    
    const baseData = {
      mealId,
      mode,
      timestamp: Date.now(),
    }

    switch (mode) {
      case 'health':
        return {
          ...baseData,
          healthScore: Math.floor(Math.random() * 30) + 70, // 70-100
          micronutrients: [
            { name: 'Vitamin C', amount: `${Math.floor(Math.random() * 50) + 20}mg`, daily: Math.floor(Math.random() * 40) + 60 },
            { name: 'Iron', amount: `${(Math.random() * 5 + 5).toFixed(1)}mg`, daily: Math.floor(Math.random() * 40) + 40 },
            { name: 'Calcium', amount: `${Math.floor(Math.random() * 200) + 100}mg`, daily: Math.floor(Math.random() * 30) + 20 },
            { name: 'Vitamin B12', amount: `${(Math.random() * 2 + 1).toFixed(1)}μg`, daily: Math.floor(Math.random() * 40) + 60 },
          ],
          recommendations: [
            'Excellent protein-to-calorie ratio',
            'Rich in antioxidants',
            'Balanced amino acid profile',
            'Consider adding leafy greens',
          ]
        }
      
      case 'fitness':
        return {
          ...baseData,
          workoutAlignment: ['Perfect Pre-Workout', 'Great Post-Workout', 'Ideal Rest Day'][Math.floor(Math.random() * 3)],
          performanceMetrics: {
            energyRating: Math.floor(Math.random() * 30) + 70,
            recoveryBoost: Math.floor(Math.random() * 40) + 60,
            hydrationSupport: Math.floor(Math.random() * 50) + 50,
            inflammationFighting: Math.floor(Math.random() * 30) + 70,
          },
          timing: `${Math.floor(Math.random() * 60) + 30}-${Math.floor(Math.random() * 60) + 60} minutes before training`
        }

      case 'cultural':
        return {
          ...baseData,
          origin: ['Mediterranean', 'Asian Fusion', 'Latin American', 'Nordic'][Math.floor(Math.random() * 4)],
          culturalScore: Math.floor(Math.random() * 20) + 80,
          traditions: [
            'Ancient cooking techniques',
            'Seasonal ingredient harmony',
            'Traditional spice combinations',
            'Cultural significance',
          ]
        }

      case 'chef':
        return {
          ...baseData,
          technique: ['Pan-seared', 'Slow-braised', 'Grilled', 'Steamed'][Math.floor(Math.random() * 4)],
          platingScore: Math.floor(Math.random() * 30) + 70,
          improvements: [
            'Add microgreens for color',
            'Consider sauce drizzle',
            'Warm the plates',
            'Garnish with herbs',
          ]
        }

      case 'science':
        return {
          ...baseData,
          glycemicIndex: Math.floor(Math.random() * 40) + 40,
          oxidativeStress: 'Low',
          bioavailability: Math.floor(Math.random() * 30) + 70,
          compounds: [
            'Leucine for muscle synthesis',
            'Lycopene for heart health',
            'Polyphenols for brain function',
            'Omega-3 for inflammation',
          ]
        }

      case 'budget':
        return {
          ...baseData,
          estimatedCost: `$${(Math.random() * 5 + 2).toFixed(2)}`,
          costPerCalorie: `$${(Math.random() * 0.01 + 0.005).toFixed(4)}`,
          seasonalScore: Math.floor(Math.random() * 40) + 60,
          savings: [
            'Buy proteins in bulk',
            'Shop seasonal vegetables',
            'Meal prep in batches',
            'Grow herbs at home',
          ]
        }

      default:
        return baseData
    }
  }, [])

  const preloadAnalysis = useCallback(async (mealId: string, mode: string): Promise<AnalysisData> => {
    // Check if already cached
    const cached = getCachedAnalysis(mealId, mode)
    if (cached) {
      return cached
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))

    // Generate new analysis data
    const data = generateAnalysisData(mealId, mode)
    
    // Cache the result
    setCachedAnalysis(mealId, mode, data)
    
    return data
  }, [getCachedAnalysis, setCachedAnalysis, generateAnalysisData])

  return {
    getCachedAnalysis,
    setCachedAnalysis,
    isCached,
    clearCache,
    getCacheSize,
    preloadAnalysis,
  }
}