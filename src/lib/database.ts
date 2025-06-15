import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { createPool, Pool } from '@vercel/postgres'
import { log } from './logger'

// Enhanced Supabase client with optimized configuration
let supabaseClient: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration')
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false, // Server-side doesn't need persistent sessions
        detectSessionInUrl: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-application-name': 'mealappeal'
        }
      },
      // Optimize for server-side usage
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })

    log.info('Supabase client initialized', {
      url: supabaseUrl.replace(/.*@/, '***@'), // Hide credentials in logs
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    })
  }

  return supabaseClient
}

// Connection pooling for direct PostgreSQL access (if needed)
let pgPool: Pool | null = null

export function getPgPool(): Pool {
  if (!pgPool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL

    if (!connectionString) {
      throw new Error('No PostgreSQL connection string found')
    }

    pgPool = createPool({
      connectionString,
      // Optimize connection pool for serverless
      max: process.env.NODE_ENV === 'production' ? 20 : 5,
      min: 0,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      // Vercel-specific optimizations
      allowExitOnIdle: true
    })

    log.info('PostgreSQL connection pool initialized', {
      maxConnections: process.env.NODE_ENV === 'production' ? 20 : 5,
      environment: process.env.NODE_ENV
    })
  }

  return pgPool
}

// Enhanced database operations with retry logic and timeouts
export class DatabaseOperations {
  private supabase: SupabaseClient
  private maxRetries = 3
  private baseDelay = 1000 // 1 second

  constructor() {
    this.supabase = getSupabaseClient()
  }

  // Retry logic with exponential backoff
  private async withRetry<T>(
    operation: () => Promise<T>,
    context: string,
    attempt = 1
  ): Promise<T> {
    try {
      return await operation()
    } catch (error: any) {
      if (attempt >= this.maxRetries) {
        log.error(`Database operation failed after ${this.maxRetries} attempts`, error, {
          context,
          attempts: attempt
        })
        throw error
      }

      // Calculate delay with jitter
      const delay = this.baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000
      
      log.warn(`Database operation failed, retrying`, {
        context,
        attempt,
        nextRetryIn: delay,
        error: error.message
      })

      await new Promise(resolve => setTimeout(resolve, delay))
      return this.withRetry(operation, context, attempt + 1)
    }
  }

  // Optimized profile fetch with fallback
  async getProfile(userId: string) {
    return this.withRetry(async () => {
      const { data, error } = await this.supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          subscription_tier,
          subscription_expires_at,
          billing_cycle,
          meal_count,
          monthly_shares_used,
          share_reset_date,
          stripe_customer_id,
          stripe_subscription_id
        `)
        .eq('id', userId)
        .single()
        .abortSignal(AbortSignal.timeout(5000)) // 5 second timeout

      if (error) {
        // Handle missing profile gracefully
        if (error.code === 'PGRST116') {
          log.warn('Profile not found, will need to create', { userId })
          return null
        }
        throw error
      }

      return data
    }, 'getProfile')
  }

  // Optimized meal insertion with conflict handling
  async createMeal(mealData: any) {
    return this.withRetry(async () => {
      const { data, error } = await this.supabase
        .from('meals')
        .insert(mealData)
        .select()
        .single()
        .abortSignal(AbortSignal.timeout(10000)) // 10 second timeout for file operations

      if (error) {
        throw error
      }

      return data
    }, 'createMeal')
  }

  // Batch operations for analytics
  async batchInsertAnalytics(events: any[]) {
    if (events.length === 0) return

    return this.withRetry(async () => {
      const { error } = await this.supabase
        .from('analytics_events')
        .insert(events)
        .abortSignal(AbortSignal.timeout(15000))

      if (error) {
        throw error
      }
    }, 'batchInsertAnalytics')
  }

  // Optimized count queries
  async getMealCountToday(userId: string) {
    return this.withRetry(async () => {
      const today = new Date().toISOString().split('T')[0]
      
      const { count, error } = await this.supabase
        .from('meals')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', today)
        .lt('created_at', new Date(today + 'T23:59:59.999Z').toISOString())
        .abortSignal(AbortSignal.timeout(3000))

      if (error) {
        throw error
      }

      return count || 0
    }, 'getMealCountToday')
  }

  // Health check for database
  async healthCheck() {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('count')
        .limit(1)
        .single()
        .abortSignal(AbortSignal.timeout(2000))

      return {
        status: 'healthy',
        error: null,
        latency: Date.now()
      }
    } catch (error: any) {
      return {
        status: 'unhealthy',
        error: error.message,
        latency: Date.now()
      }
    }
  }
}

// Singleton instance
let dbOps: DatabaseOperations | null = null

export function getDbOperations(): DatabaseOperations {
  if (!dbOps) {
    dbOps = new DatabaseOperations()
  }
  return dbOps
}

// Connection cleanup for graceful shutdown
export async function closeConnections() {
  try {
    if (pgPool) {
      await pgPool.end()
      pgPool = null
      log.info('PostgreSQL connection pool closed')
    }
    
    // Supabase client doesn't need explicit cleanup
    supabaseClient = null
    
    log.info('Database connections cleaned up')
  } catch (error) {
    log.error('Error closing database connections', error as Error)
  }
}