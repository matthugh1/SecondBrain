import * as Sentry from '@sentry/nextjs'

export function init() {
  Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Lower sample rate for edge runtime
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 0.5,
  
  debug: process.env.NODE_ENV === 'development',
  
  // Filter out non-critical errors
  beforeSend(event, hint) {
    // Don't send 404 errors
    if (event.exception) {
      const error = hint.originalException
      if (error instanceof Error && error.message.includes('404')) {
        return null
      }
    }
    
    return event
  },
  
  environment: process.env.NODE_ENV || 'development',
  release: process.env.SENTRY_RELEASE,
  })
}
