# Sentry Error Tracking Setup

This document describes how to set up Sentry error tracking for the SecondBrain application.

## Environment Variables

Add these environment variables to your `.env.local` and production environment:

```bash
# Sentry DSN (get from Sentry project settings)
SENTRY_DSN=https://your-dsn@sentry.io/project-id
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Optional: Sentry organization and project (for source map uploads)
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project

# Optional: Release version (for tracking deployments)
SENTRY_RELEASE=1.0.0

# Optional: Enable Sentry in development (default: disabled)
ENABLE_SENTRY=true
```

## Features

### Automatic Error Capture
- All errors caught by `handleError()` are automatically sent to Sentry
- Errors include:
  - Request ID (for tracing)
  - Tenant ID (sanitized)
  - User ID (sanitized)
  - IP Address
  - User Agent
  - Stack traces
  - Error context

### Error Filtering
- 404 errors are filtered out (not sent to Sentry)
- Validation errors (ZodError) are filtered out (expected errors)
- Sensitive data is automatically redacted

### Error Context
Errors are enriched with:
- Request context (requestId, tenantId, userId)
- Error tags (error_code, error_type)
- Additional context (endpoint, operation)

## Configuration Files

- `sentry.client.config.ts` - Client-side Sentry configuration
- `sentry.server.config.ts` - Server-side Sentry configuration
- `sentry.edge.config.ts` - Edge runtime Sentry configuration
- `instrumentation.ts` - Next.js instrumentation hook
- `app/global-error.tsx` - Global error boundary for React errors

## Usage

Errors are automatically captured when using `handleError()`:

```typescript
import { handleError } from '@/lib/middleware/error-handler'

export async function POST(request: NextRequest) {
  try {
    // Your code
  } catch (error) {
    return handleError(error, '/api/endpoint')
    // Error is automatically sent to Sentry with context
  }
}
```

## Sentry Dashboard

1. Go to https://sentry.io
2. Create a project (or use existing)
3. Copy the DSN to environment variables
4. View errors in the Sentry dashboard

## Alerting

Configure alerts in Sentry dashboard:
1. Go to Project Settings → Alerts
2. Create alert rules for:
   - Error rate > threshold
   - New issues
   - Regression issues
3. Configure notification channels (email, Slack, PagerDuty)

## Source Maps

Source maps are automatically uploaded during build (if `SENTRY_ORG` and `SENTRY_PROJECT` are set).

This allows Sentry to show original source code in error stack traces.

## Disabling Sentry

To disable Sentry:
1. Remove `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` environment variables
2. Or set `ENABLE_SENTRY=false` in development
