import { NextRequest, NextResponse } from 'next/server'
import { validateEnvironment, getEnvironmentInfo } from '@/lib/env-validation'
import { log } from '@/lib/logger'

// Environment validation endpoint for debugging
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Only allow in development or with admin access
    if (process.env.NODE_ENV === 'production') {
      // In production, require admin auth or specific header
      const adminKey = request.headers.get('x-admin-key')
      if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        )
      }
    }

    const validation = validateEnvironment()
    const info = getEnvironmentInfo()

    log.info('Environment validation requested', {
      isValid: validation.isValid,
      environment: info.nodeEnv,
      platform: info.platform
    })

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      validation,
      info,
      // Don't expose actual values in production
      configuredServices: {
        supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        openai: !!process.env.OPENAI_API_KEY,
        stripe: !!process.env.STRIPE_SECRET_KEY,
        redis: info.hasRedis,
        sentry: info.hasSentry,
        usda: info.hasUSDA
      }
    })

  } catch (error: any) {
    log.error('Environment validation endpoint failed', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}