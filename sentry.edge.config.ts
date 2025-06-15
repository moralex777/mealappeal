import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Only initialize Sentry if DSN is provided
  enabled: !!process.env.SENTRY_DSN,
  
  // Reduced sampling for edge runtime
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
  
  // Configure environment
  environment: process.env.NODE_ENV || 'development',
  
  // Configure release if available
  release: process.env.VERCEL_GIT_COMMIT_SHA,
})