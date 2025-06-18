import { createClient } from '@supabase/supabase-js'
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

import { log } from '@/lib/logger'

// Health check endpoint for production monitoring
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  const checks: Record<string, { status: 'healthy' | 'unhealthy' | 'degraded'; message?: string; duration?: number }> = {}

  try {
    // 1. Environment Variables Check
    const requiredEnvVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENAI_API_KEY'
    ]
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar])
    
    checks.environment = {
      status: missingEnvVars.length === 0 ? 'healthy' : 'unhealthy',
      message: missingEnvVars.length > 0 ? `Missing: ${missingEnvVars.join(', ')}` : 'All required variables present'
    }

    // 2. Supabase Database Check
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const dbStartTime = Date.now()
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )
        
        // Simple query to test connection
        const { data, error } = await supabase
          .from('profiles')
          .select('count')
          .limit(1)
          .single()
        
        const dbDuration = Date.now() - dbStartTime
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" which is fine
          checks.database = {
            status: 'unhealthy',
            message: `Database error: ${error.message}`,
            duration: dbDuration
          }
        } else {
          checks.database = {
            status: dbDuration > 1000 ? 'degraded' : 'healthy',
            message: dbDuration > 1000 ? 'Slow response' : 'Connection successful',
            duration: dbDuration
          }
        }
      } catch (error: any) {
        checks.database = {
          status: 'unhealthy',
          message: `Connection failed: ${error.message}`,
          duration: Date.now() - dbStartTime
        }
      }
    } else {
      checks.database = {
        status: 'unhealthy',
        message: 'Supabase configuration missing'
      }
    }

    // 3. OpenAI API Check
    if (process.env.OPENAI_API_KEY) {
      const openaiStartTime = Date.now()
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
        
        // Simple API call to test connection
        await openai.models.retrieve('gpt-4o-mini-2024-07-18')
        
        const openaiDuration = Date.now() - openaiStartTime
        checks.openai = {
          status: openaiDuration > 2000 ? 'degraded' : 'healthy',
          message: openaiDuration > 2000 ? 'Slow response' : 'API accessible',
          duration: openaiDuration
        }
      } catch (error: any) {
        checks.openai = {
          status: 'unhealthy',
          message: `API error: ${error.message}`,
          duration: Date.now() - openaiStartTime
        }
      }
    } else {
      checks.openai = {
        status: 'unhealthy',
        message: 'OpenAI API key missing'
      }
    }

    // 4. Redis Check (optional)
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      const redisStartTime = Date.now()
      try {
        const { Redis } = await import('@upstash/redis')
        const redis = new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN
        })
        
        // Simple ping test
        await redis.ping()
        
        const redisDuration = Date.now() - redisStartTime
        checks.redis = {
          status: redisDuration > 1000 ? 'degraded' : 'healthy',
          message: redisDuration > 1000 ? 'Slow response' : 'Connection successful',
          duration: redisDuration
        }
      } catch (error: any) {
        checks.redis = {
          status: 'unhealthy',
          message: `Redis error: ${error.message}`,
          duration: Date.now() - redisStartTime
        }
      }
    } else {
      checks.redis = {
        status: 'degraded',
        message: 'Redis not configured - using fallback'
      }
    }

    // Determine overall health
    const allChecks = Object.values(checks)
    const hasUnhealthy = allChecks.some(check => check.status === 'unhealthy')
    const hasDegraded = allChecks.some(check => check.status === 'degraded')
    
    const overallStatus = hasUnhealthy ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy'
    const statusCode = hasUnhealthy ? 503 : hasDegraded ? 200 : 200

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
      environment: process.env.NODE_ENV || 'unknown',
      uptime: process.uptime(),
      duration: Date.now() - startTime,
      checks
    }

    // Log health check results
    log.info('Health check completed', {
      status: overallStatus,
      duration: response.duration,
      checks: Object.keys(checks).reduce((acc, key) => {
        acc[key] = checks[key].status
        return acc
      }, {} as Record<string, string>)
    })

    return NextResponse.json(response, { status: statusCode })

  } catch (error: any) {
    log.error('Health check failed', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      duration: Date.now() - startTime,
      checks
    }, { status: 503 })
  }
}

// HEAD method for simple uptime monitoring
export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, { status: 200 })
}