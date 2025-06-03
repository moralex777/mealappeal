// Environment Variable Validation for MealAppeal
// Validates all required environment variables at startup

export interface IEnvConfig {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string

  // OpenAI
  OPENAI_API_KEY: string

  // Stripe
  STRIPE_SECRET_KEY: string
  STRIPE_PUBLISHABLE_KEY: string
  STRIPE_PREMIUM_MONTHLY_PRICE_ID: string
  STRIPE_PREMIUM_YEARLY_PRICE_ID: string
  STRIPE_WEBHOOK_SECRET: string

  // App
  NEXT_PUBLIC_APP_URL: string
  NODE_ENV: string
}

export function validateEnvironment(): IEnvConfig {
  const env = process.env
  const errors: string[] = []

  // Required variables
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
    'STRIPE_PREMIUM_MONTHLY_PRICE_ID',
    'STRIPE_PREMIUM_YEARLY_PRICE_ID',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_APP_URL',
  ]

  // Check for missing variables
  for (const varName of requiredVars) {
    if (!env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`)
    }
  }

  // Validate Supabase URL format
  if (env['NEXT_PUBLIC_SUPABASE_URL'] && !env['NEXT_PUBLIC_SUPABASE_URL']!.startsWith('https://')) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL must start with https://')
  }

  // Validate OpenAI API key format
  if (env['OPENAI_API_KEY'] && !env['OPENAI_API_KEY']!.startsWith('sk-')) {
    errors.push('OPENAI_API_KEY must start with sk-')
  }

  // Validate Stripe keys format
  if (env['STRIPE_SECRET_KEY'] && !env['STRIPE_SECRET_KEY']!.startsWith('sk_')) {
    errors.push('STRIPE_SECRET_KEY must start with sk_')
  }

  if (env['STRIPE_PUBLISHABLE_KEY'] && !env['STRIPE_PUBLISHABLE_KEY']!.startsWith('pk_')) {
    errors.push('STRIPE_PUBLISHABLE_KEY must start with pk_')
  }

  // Validate webhook secret
  if (env['STRIPE_WEBHOOK_SECRET'] && !env['STRIPE_WEBHOOK_SECRET']!.startsWith('whsec_')) {
    errors.push('STRIPE_WEBHOOK_SECRET must start with whsec_')
  }

  // Validate app URL
  if (env['NEXT_PUBLIC_APP_URL'] && !env['NEXT_PUBLIC_APP_URL']!.startsWith('http')) {
    errors.push('NEXT_PUBLIC_APP_URL must start with http:// or https://')
  }

  // If there are errors, throw with helpful message
  if (errors.length > 0) {
    const errorMessage = [
      '❌ Environment validation failed:',
      '',
      ...errors.map(error => `  • ${error}`),
      '',
      '📝 Please check your .env.local file or deployment environment variables.',
      '📖 See .env.example for required format.',
      '',
    ].join('\n')

    throw new Error(errorMessage)
  }

  // Return validated config
  return {
    NEXT_PUBLIC_SUPABASE_URL: env['NEXT_PUBLIC_SUPABASE_URL']!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    SUPABASE_SERVICE_ROLE_KEY: env['SUPABASE_SERVICE_ROLE_KEY']!,
    OPENAI_API_KEY: env['OPENAI_API_KEY']!,
    STRIPE_SECRET_KEY: env['STRIPE_SECRET_KEY']!,
    STRIPE_PUBLISHABLE_KEY: env['STRIPE_PUBLISHABLE_KEY']!,
    STRIPE_PREMIUM_MONTHLY_PRICE_ID: env['STRIPE_PREMIUM_MONTHLY_PRICE_ID']!,
    STRIPE_PREMIUM_YEARLY_PRICE_ID: env['STRIPE_PREMIUM_YEARLY_PRICE_ID']!,
    STRIPE_WEBHOOK_SECRET: env['STRIPE_WEBHOOK_SECRET']!,
    NEXT_PUBLIC_APP_URL: env['NEXT_PUBLIC_APP_URL']!,
    NODE_ENV: env['NODE_ENV'] || 'development',
  }
}

// Helper to check if we're in production
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

// Helper to get safe environment info for debugging (without secrets)
export function getEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    hasStripe: !!process.env.STRIPE_SECRET_KEY,
    hasWebhook: !!process.env.STRIPE_WEBHOOK_SECRET,
    appUrl: process.env.NEXT_PUBLIC_APP_URL,
  }
}
