// MealAppeal Supabase Client Configuration
// Action 026: Database and authentication connection

import { createClient } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Environment variables validation - Fixed URL
const supabaseUrl = 'https://dxuabbcppncshcparsqd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dWFiYmNwcG5jc2hjcGFyc3FkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MzY5MDAsImV4cCI6MjA2NDExMjkwMH0.RXSD68SZI6GlLRwtbmgbRYYJ-90_x7Xm75xC_8i5yac'
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dWFiYmNwcG5jc2hjcGFyc3FkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODUzNjkwMCwiZXhwIjoyMDY0MTEyOTAwfQ.DgxBwWPIAqKV7yPd-8eX18YdT3jQ0RgNqs5Cs4QZ9FE'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Single client instance to prevent multiple client warning
let clientInstance: any = null

export const supabase = (() => {
  if (typeof window === 'undefined') {
    // Server-side: always create new client
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }
  
  // Browser-side: reuse single instance
  if (!clientInstance) {
    clientInstance = createClientComponentClient()
  }
  
  return clientInstance
})()

// Admin client (for server-side operations that bypass RLS)
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Database type definitions for TypeScript
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          subscription_tier: 'free' | 'premium'
          subscription_status: 'active' | 'canceled' | 'past_due'
          stripe_customer_id: string | null
          meal_count: number
          monthly_shares_used: number
          share_reset_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'premium'
          subscription_status?: 'active' | 'canceled' | 'past_due'
          stripe_customer_id?: string | null
          meal_count?: number
          monthly_shares_used?: number
          share_reset_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'premium'
          subscription_status?: 'active' | 'canceled' | 'past_due'
          stripe_customer_id?: string | null
          meal_count?: number
          monthly_shares_used?: number
          share_reset_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      meals: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          image_url: string
          image_path: string
          is_public: boolean
          ai_confidence_score: number
          processing_status: 'pending' | 'processing' | 'completed' | 'failed'
          scheduled_deletion_date: string | null
          grace_period_notified: boolean
          view_count: number
          like_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          image_url: string
          image_path: string
          is_public?: boolean
          ai_confidence_score?: number
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed'
          scheduled_deletion_date?: string | null
          grace_period_notified?: boolean
          view_count?: number
          like_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          image_url?: string
          image_path?: string
          is_public?: boolean
          ai_confidence_score?: number
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed'
          scheduled_deletion_date?: string | null
          grace_period_notified?: boolean
          view_count?: number
          like_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      ingredients: {
        Row: {
          id: string
          name: string
          usda_id: string | null
          category: string | null
          calories_per_100g: number | null
          protein_per_100g: number | null
          carbs_per_100g: number | null
          fat_per_100g: number | null
          fiber_per_100g: number | null
          sodium_per_100g: number | null
          sugar_per_100g: number | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          usda_id?: string | null
          category?: string | null
          calories_per_100g?: number | null
          protein_per_100g?: number | null
          carbs_per_100g?: number | null
          fat_per_100g?: number | null
          fiber_per_100g?: number | null
          sodium_per_100g?: number | null
          sugar_per_100g?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          usda_id?: string | null
          category?: string | null
          calories_per_100g?: number | null
          protein_per_100g?: number | null
          carbs_per_100g?: number | null
          fat_per_100g?: number | null
          fiber_per_100g?: number | null
          sodium_per_100g?: number | null
          sugar_per_100g?: number | null
          created_at?: string
        }
      }
      meal_ingredients: {
        Row: {
          id: string
          meal_id: string
          ingredient_id: string
          quantity: number
          unit: string
          confidence_score: number
          created_at: string
        }
        Insert: {
          id?: string
          meal_id: string
          ingredient_id: string
          quantity?: number
          unit?: string
          confidence_score?: number
          created_at?: string
        }
        Update: {
          id?: string
          meal_id?: string
          ingredient_id?: string
          quantity?: number
          unit?: string
          confidence_score?: number
          created_at?: string
        }
      }
      meal_likes: {
        Row: {
          id: string
          user_id: string
          meal_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          meal_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          meal_id?: string
          created_at?: string
        }
      }
    }
  }
}

// Helper functions for common database operations
export const DatabaseHelpers = {
  // Get user profile
  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    return { data, error }
  },

  // Create or update user profile
  async upsertProfile(profile: Database['public']['Tables']['profiles']['Insert']) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile)
      .select()
      .single()
    
    return { data, error }
  },

  // Get user's meals
  async getUserMeals(userId: string, limit = 20) {
    const { data, error } = await supabase
      .from('meals')
      .select(`
        *,
        meal_ingredients (
          quantity,
          unit,
          confidence_score,
          ingredients (name, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    return { data, error }
  },

  // Get public meals for feed
  async getPublicMeals(limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('meals')
      .select(`
        *,
        profiles (full_name, avatar_url),
        meal_ingredients (
          quantity,
          unit,
          ingredients (name)
        )
      `)
      .eq('is_public', true)
      .eq('processing_status', 'completed')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    return { data, error }
  },

  // Check if user can share publicly
  async canUserSharePublicly(userId: string) {
    const { data, error } = await supabase
      .rpc('can_user_share_publicly', { user_uuid: userId })
    
    return { canShare: data, error }
  },

  // Get user storage stats
  async getUserStorageStats(userId: string) {
    const { data: meals } = await supabase
      .from('meals')
      .select('scheduled_deletion_date')
      .eq('user_id', userId)
    
    const expiringMeals = meals?.filter(meal => {
      if (!meal.scheduled_deletion_date) return false
      const daysUntilExpiry = Math.ceil((new Date(meal.scheduled_deletion_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry <= 3
    }) || []

    return {
      data: {
        totalMeals: meals?.length || 0,
        expiringMeals: expiringMeals.length,
        daysUntilNextExpiry: 14,
        monthlySharesUsed: 0
      },
      error: null
    }
  }
}