import { NextRequest, NextResponse } from 'next/server'
import { recordTiming, recordError, recordSuccess } from '@/lib/metrics'
import { getRequestId } from './request-id'

/**
 * Middleware to track request metrics
 * Measures latency and error rates for all API routes
 */
export function withMetrics(
  handler: (request: NextRequest) => Promise<NextResponse>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const start = Date.now()
    const method = request.method
    const pathname = request.nextUrl.pathname
    const endpoint = `${method} ${pathname}`

    try {
      const response = await handler(request)
      const duration = Date.now() - start

      // Record metrics
      const requestId = getRequestId()
      const labels = {
        method,
        pathname,
        status: response.status.toString(),
        ...(requestId && { requestId }),
      }

      if (response.status >= 400) {
        recordError(endpoint, response.status, labels)
      } else {
        recordSuccess(endpoint, labels)
      }

      recordTiming('http_request_duration_ms', duration, labels)

      return response
    } catch (error) {
      const duration = Date.now() - start
      const requestId = getRequestId()
      const labels = {
        method,
        pathname,
        ...(requestId && { requestId }),
      }

      recordError(endpoint, 500, { ...labels, error: 'exception' })
      recordTiming('http_request_duration_ms', duration, { ...labels, status: 'error' })

      throw error
    }
  }
}

/**
 * Helper to wrap API route handlers with metrics
 * 
 * @example
 * ```typescript
 * export const POST = withMetrics(async (request: NextRequest) => {
 *   // Your handler code
 * })
 * ```
 */
export function withMetricsHandler(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return withMetrics(handler)
}
