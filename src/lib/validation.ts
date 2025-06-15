import { z } from 'zod'

// Food analysis request validation
export const analyzeRequestSchema = z.object({
  imageDataUrl: z
    .string()
    .min(1, 'Image data is required')
    .refine(
      (data) => data.startsWith('data:image/'),
      'Must be a valid base64 image data URL'
    )
    .refine(
      (data) => data.length <= 10 * 1024 * 1024, // 10MB limit
      'Image size must be less than 10MB'
    ),
  focusMode: z
    .enum(['health', 'fitness', 'cultural', 'chef', 'science', 'budget'])
    .default('health')
})

// User profile validation
export const profileUpdateSchema = z.object({
  full_name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  notification_preferences: z.object({
    email_updates: z.boolean(),
    meal_reminders: z.boolean(),
    weekly_reports: z.boolean()
  }).optional()
})

// Stripe webhook validation
export const stripeWebhookSchema = z.object({
  id: z.string(),
  object: z.literal('event'),
  type: z.string(),
  data: z.object({
    object: z.record(z.any())
  })
})

// Environment validation
export const environmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url()
    .refine(
      (url) => url.includes('.supabase.co'),
      'Must be a valid Supabase URL'
    ),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(10, 'Service role key is required'),
  OPENAI_API_KEY: z
    .string()
    .startsWith('sk-', 'Must be a valid OpenAI API key'),
  STRIPE_SECRET_KEY: z
    .string()
    .startsWith('sk_', 'Must be a valid Stripe secret key')
    .optional(),
  STRIPE_WEBHOOK_SECRET: z
    .string()
    .startsWith('whsec_', 'Must be a valid Stripe webhook secret')
    .optional(),
  UPSTASH_REDIS_REST_URL: z
    .string()
    .url()
    .optional(),
  UPSTASH_REDIS_REST_TOKEN: z
    .string()
    .min(10)
    .optional(),
  SENTRY_DSN: z
    .string()
    .url()
    .optional(),
  USDA_API_KEY: z
    .string()
    .min(10)
    .optional()
})

// API rate limit validation
export const rateLimitSchema = z.object({
  identifier: z.string().min(1),
  limit: z.number().min(1).max(10000),
  window: z.string().regex(/^\d+[smhd]$/, 'Must be a valid time window (e.g., 1h, 30m)')
})

// Sanitization helpers
export function sanitizeHtml(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim()
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .substring(0, 100) // Limit length
}

// Input validation middleware
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean
  data?: T
  errors?: string[]
} {
  try {
    const validated = schema.parse(data)
    return { success: true, data: validated }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
      }
    }
    return {
      success: false,
      errors: ['Invalid input format']
    }
  }
}

// CORS configuration
export const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.NODE_ENV === 'production' 
    ? process.env.NEXT_PUBLIC_APP_URL || 'https://mealappeal.vercel.app'
    : '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400', // 24 hours
  'Vary': 'Origin'
}

// Security headers
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': process.env.NODE_ENV === 'production' 
    ? 'max-age=31536000; includeSubDomains' 
    : undefined
}

// Request validation helper
export function createValidatedHandler<T>(
  schema: z.ZodSchema<T>,
  handler: (data: T, request: Request) => Promise<Response>
) {
  return async (request: Request): Promise<Response> => {
    try {
      // Handle CORS preflight
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 200,
          headers: corsHeaders
        })
      }

      // Parse and validate request body
      const body = await request.json()
      const validation = validateInput(schema, body)

      if (!validation.success) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid input',
          details: validation.errors
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
            ...securityHeaders
          }
        })
      }

      // Execute handler with validated data
      const response = await handler(validation.data!, request)
      
      // Add security headers to response
      Object.entries(securityHeaders).forEach(([key, value]) => {
        if (value) {
          response.headers.set(key, value)
        }
      })

      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })

      return response

    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal server error'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
          ...securityHeaders
        }
      })
    }
  }
}