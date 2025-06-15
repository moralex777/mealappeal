import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize Redis connection
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

// Fallback to in-memory for development
const fallbackStore = new Map<string, { count: number; resetTime: number }>()

// Rate limit configurations by tier
const RATE_LIMITS = {
  free: { max: 10, window: '1h' as const },
  premium_monthly: { max: 100, window: '1h' as const },
  premium_yearly: { max: 200, window: '1h' as const }
}

// Create rate limiters
const rateLimiters = redis ? {
  free: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(RATE_LIMITS.free.max, RATE_LIMITS.free.window),
    analytics: true,
    prefix: 'mealappeal:ratelimit:free'
  }),
  premium_monthly: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(RATE_LIMITS.premium_monthly.max, RATE_LIMITS.premium_monthly.window),
    analytics: true,
    prefix: 'mealappeal:ratelimit:premium_monthly'
  }),
  premium_yearly: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(RATE_LIMITS.premium_yearly.max, RATE_LIMITS.premium_yearly.window),
    analytics: true,
    prefix: 'mealappeal:ratelimit:premium_yearly'
  })
} : null

// Fallback rate limiting for development
function fallbackRateLimit(userId: string, tier: string): { success: boolean; remaining: number; reset: number } {
  const now = Date.now()
  const windowMs = 60 * 60 * 1000 // 1 hour
  const key = `${userId}:${tier}`
  const limit = RATE_LIMITS[tier as keyof typeof RATE_LIMITS]?.max || 10
  
  const existing = fallbackStore.get(key)
  
  if (!existing || now > existing.resetTime) {
    // New window
    fallbackStore.set(key, { count: 1, resetTime: now + windowMs })
    return { success: true, remaining: limit - 1, reset: now + windowMs }
  }
  
  if (existing.count >= limit) {
    return { success: false, remaining: 0, reset: existing.resetTime }
  }
  
  existing.count++
  fallbackStore.set(key, existing)
  return { success: true, remaining: limit - existing.count, reset: existing.resetTime }
}

export async function checkRateLimit(
  userId: string, 
  tier: 'free' | 'premium_monthly' | 'premium_yearly'
): Promise<{ success: boolean; remaining: number; reset: number; error?: string }> {
  try {
    if (!rateLimiters) {
      console.warn('⚠️ Redis not configured, using fallback rate limiting')
      return fallbackRateLimit(userId, tier)
    }

    const limiter = rateLimiters[tier]
    const result = await limiter.limit(userId)
    
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset
    }
  } catch (error) {
    console.error('❌ Rate limiting error:', error)
    // Fallback to in-memory on Redis failure
    return fallbackRateLimit(userId, tier)
  }
}

export function getRateLimitInfo(tier: 'free' | 'premium_monthly' | 'premium_yearly') {
  return RATE_LIMITS[tier]
}