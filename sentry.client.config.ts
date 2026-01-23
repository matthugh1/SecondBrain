import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
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
    
    // Don't send validation errors (they're expected)
    if (event.exception) {
      const error = hint.originalException
      if (error instanceof Error && error.name === 'ZodError') {
        return null
      }
    }
    
    return event
  },
  
  // Redact sensitive data
  beforeBreadcrumb(breadcrumb) {
    // Remove sensitive data from breadcrumbs
    if (breadcrumb.data) {
      // Redact common sensitive fields
      const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization', 'cookie']
      for (const field of sensitiveFields) {
        if (breadcrumb.data[field]) {
          breadcrumb.data[field] = '[Redacted]'
        }
      }
    }
    return breadcrumb
  },
  
  // Environment
  environment: process.env.NODE_ENV || 'development',
  
  // Release tracking (set via SENTRY_RELEASE env var or auto-detect from git)
  release: process.env.SENTRY_RELEASE,
})
