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
  
  // Configure which URLs to ignore
  beforeSend(event, hint) {
    // Don't send events if Sentry is not configured
    if (!process.env.SENTRY_DSN) {
      return null
    }
    
    // Filter out common browser errors that we can't control
    if (event.exception) {
      const error = hint.originalException
      if (error && typeof error === 'object' && 'message' in error) {
        const message = (error as Error).message
        if (
          message.includes('ResizeObserver loop limit exceeded') ||
          message.includes('Non-Error promise rejection captured') ||
          message.includes('Network request failed')
        ) {
          return null
        }
      }
    }
    
    return event
  },
  
  // Configure environment
  environment: process.env.NODE_ENV || 'development',
  
  // Configure release if available
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  
  // Configure integrations
  integrations: [
    Sentry.replayIntegration({
      // Only record replays for errors in production
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // Configure replay sampling
  replaysSessionSampleRate: 0.0, // Don't record any replays by default
  replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.0,
})