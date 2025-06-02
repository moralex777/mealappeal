// MealAppeal Supabase Client Configuration
// Action 026: Database and authentication connection

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'

import type { Database } from './database.types'

// Environment variables validation
const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? ''
const supabaseAnonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? ''
const supabaseServiceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables')
}

// Single client instance to prevent multiple client warning
let clientInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null

// Connection retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function createSupabaseClient(
  retryCount = 0
): Promise<ReturnType<typeof createClientComponentClient<Database>>> {
  try {
    if (typeof window === 'undefined') {
      // Server-side: always create new client
      return createClient<Database>(supabaseUrl, supabaseAnonKey)
    }

    // Browser-side: reuse single instance
    if (!clientInstance) {
      clientInstance = createClientComponentClient<Database>()
    }

    if (!clientInstance) {
      throw new Error('Failed to create Supabase client')
    }

    return clientInstance
  } catch (error) {
    console.error(
      `Supabase client creation failed (attempt ${retryCount + 1}/${MAX_RETRIES}):`,
      error
    )

    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY}ms...`)
      await sleep(RETRY_DELAY)
      return createSupabaseClient(retryCount + 1)
    }

    throw new Error('Failed to initialize Supabase client after multiple attempts')
  }
}

// Initialize the Supabase client
let supabaseInstance: SupabaseClient<Database, 'public'> | null = null

export const getSupabase = async () => {
  if (!supabaseInstance) {
    supabaseInstance = await createSupabaseClient()
  }
  return supabaseInstance
}

// Admin client (for server-side operations that bypass RLS)
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null

// Storage stats interface
interface IStorageStats {
  totalMeals: number
  expiringMeals: number
  daysUntilNextExpiry: number
  monthlySharesUsed: number
}

// Database helper functions with proper error handling
export const DatabaseHelpers = {
  async getUserProfile(userId: string) {
    const client = await getSupabase()
    try {
      const response = await client.from('profiles').select('*').eq('id', userId).single()

      if (response.error) {
        throw new Error(`Failed to get user profile: ${response.error.message}`)
      }

      return response
    } catch (error) {
      console.error('Database helper error:', error)
      throw error
    }
  },

  async upsertProfile(profile: Database['public']['Tables']['profiles']['Insert']) {
    const client = await getSupabase()
    try {
      const response = await client.from('profiles').upsert(profile).select().single()

      if (response.error) {
        throw new Error(`Failed to upsert profile: ${response.error.message}`)
      }

      return response
    } catch (error) {
      console.error('Database helper error:', error)
      throw error
    }
  },

  async getUserMeals(userId: string, limit = 20) {
    const client = await getSupabase()
    try {
      const response = await client
        .from('meals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (response.error) {
        throw new Error(`Failed to get user meals: ${response.error.message}`)
      }

      return response
    } catch (error) {
      console.error('Database helper error:', error)
      throw error
    }
  },

  async getPublicMeals(limit = 20, offset = 0) {
    const client = await getSupabase()
    try {
      const response = await client
        .from('meals')
        .select('*, profiles(full_name, avatar_url)')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (response.error) {
        throw new Error(`Failed to get public meals: ${response.error.message}`)
      }

      return response
    } catch (error) {
      console.error('Database helper error:', error)
      throw error
    }
  },

  async canUserSharePublicly(userId: string) {
    try {
      const { data: profile } = await this.getUserProfile(userId)
      return profile?.subscription_tier === 'premium' || (profile?.monthly_shares_used || 0) < 3
    } catch (error) {
      console.error('Database helper error:', error)
      throw error
    }
  },

  async getUserStorageStats(
    userId: string
  ): Promise<{ data: IStorageStats | null; error: Error | null }> {
    try {
      const { data: profile } = await this.getUserProfile(userId)
      if (!profile) {
        throw new Error('Profile not found')
      }

      const stats: IStorageStats = {
        totalMeals: profile.meal_count || 0,
        expiringMeals: 0, // TODO: Implement expiring meals count
        daysUntilNextExpiry: profile.subscription_tier === 'premium' ? -1 : 14,
        monthlySharesUsed: profile.monthly_shares_used || 0,
      }

      return { data: stats, error: null }
    } catch (error) {
      console.error('Database helper error:', error)
      return { data: null, error: error as Error }
    }
  },
}
