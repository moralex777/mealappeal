import { log } from './logger'

export interface EnvironmentConfig {
  required: string[]
  optional: string[]
  validation?: Record<string, (value: string) => boolean>
}

const environments: Record<string, EnvironmentConfig> = {
  development: {
    required: [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENAI_API_KEY'
    ],
    optional: [
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN',
      'SENTRY_DSN',
      'USDA_API_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET'
    ],
    validation: {
      NEXT_PUBLIC_SUPABASE_URL: (value) => value.startsWith('https://') && value.includes('.supabase.co'),
      OPENAI_API_KEY: (value) => value.startsWith('sk-'),
      STRIPE_SECRET_KEY: (value) => !value || value.startsWith('sk_'),
      SENTRY_DSN: (value) => !value || value.startsWith('https://'),
      UPSTASH_REDIS_REST_URL: (value) => !value || value.startsWith('https://')
    }
  },
  production: {
    required: [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENAI_API_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
    ],
    optional: [
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN',
      'SENTRY_DSN',
      'USDA_API_KEY',
      'RESEND_API_KEY'
    ],
    validation: {
      NEXT_PUBLIC_SUPABASE_URL: (value) => value.startsWith('https://') && value.includes('.supabase.co'),
      OPENAI_API_KEY: (value) => value.startsWith('sk-'),
      STRIPE_SECRET_KEY: (value) => value.startsWith('sk_'),
      SENTRY_DSN: (value) => !value || value.startsWith('https://'),
      UPSTASH_REDIS_REST_URL: (value) => !value || value.startsWith('https://')
    }
  }
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  missing: string[]
  invalid: string[]
}

export function validateEnvironment(env: string = process.env.NODE_ENV || 'development'): ValidationResult {
  const config = environments[env] || environments.development
  const errors: string[] = []
  const warnings: string[] = []
  const missing: string[] = []
  const invalid: string[] = []

  // Check required variables
  for (const varName of config.required) {
    const value = process.env[varName]
    
    if (!value) {
      missing.push(varName)
      errors.push(`Missing required environment variable: ${varName}`)
    } else if (config.validation?.[varName] && !config.validation[varName](value)) {
      invalid.push(varName)
      errors.push(`Invalid format for environment variable: ${varName}`)
    }
  }

  // Check optional variables for warnings
  for (const varName of config.optional) {
    const value = process.env[varName]
    
    if (!value) {
      warnings.push(`Optional environment variable not set: ${varName}`)
    } else if (config.validation?.[varName] && !config.validation[varName](value)) {
      invalid.push(varName)
      warnings.push(`Invalid format for environment variable: ${varName}`)
    }
  }

  const isValid = errors.length === 0

  // Log validation results
  if (!isValid) {
    log.error('Environment validation failed', undefined, {
      environment: env,
      missing,
      invalid,
      errorCount: errors.length
    })
  } else if (warnings.length > 0) {
    log.warn('Environment validation completed with warnings', {
      environment: env,
      warningCount: warnings.length,
      warnings: warnings.slice(0, 3) // Log first 3 warnings to avoid spam
    })
  } else {
    log.info('Environment validation passed', {
      environment: env,
      requiredCount: config.required.length,
      optionalCount: config.optional.length
    })
  }

  return {
    isValid,
    errors,
    warnings,
    missing,
    invalid
  }
}

export function getEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV || 'unknown',
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
    hasRedis: !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN),
    hasSentry: !!process.env.SENTRY_DSN,
    hasUSDA: !!process.env.USDA_API_KEY,
    platform: process.env.VERCEL ? 'vercel' : 'unknown',
    version: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown'
  }
}

// Auto-validate on import in production
if (process.env.NODE_ENV === 'production') {
  const result = validateEnvironment()
  if (!result.isValid) {
    console.error('🚨 Critical environment validation failed in production!')
    console.error('Missing required variables:', result.missing)
    console.error('Invalid variables:', result.invalid)
    // Don't exit in production, but log critical error
    log.error('Production environment validation failed - service may not function correctly', undefined, {
      missing: result.missing,
      invalid: result.invalid
    })
  }
}