import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Only initialize Sentry if DSN is provided
  enabled: !!process.env.SENTRY_DSN,
  
  // Capture 10% of transactions for performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Only capture unhandled exceptions in production
  debug: process.env.NODE_ENV === 'development',
  
  // Configure environment
  environment: process.env.NODE_ENV || 'development',
  
  // Configure release if available
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  
  // Server-specific configurations
  beforeSend(event, hint) {
    // Don't send events if Sentry is not configured
    if (!process.env.SENTRY_DSN) {
      return null
    }
    
    // Filter out common server errors that we can't control
    if (event.exception) {
      const error = hint.originalException
      if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as Error).message
        if (
          message.includes('ECONNRESET') ||
          message.includes('EPIPE') ||
          message.includes('Client closed connection')
        ) {
          return null
        }
      }
    }
    
    return event
  },
  
  // Configure which errors to ignore
  ignoreErrors: [
    'ECONNRESET',
    'EPIPE',
    'Client closed connection',
    'AbortError',
  ],
})