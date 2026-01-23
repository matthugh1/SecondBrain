import { NextRequest, NextResponse } from 'next/server'

/**
 * Simple in-memory rate limiter
 * For production, consider using @upstash/ratelimit or Vercel Edge Config
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (cleared on server restart)
// For production, use Redis or Edge Config
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

export interface RateLimitOptions {
  maxRequests: number
  windowMs: number // Time window in milliseconds
  identifier?: (request: NextRequest) => string // Custom identifier function
}

/**
 * Rate limit middleware
 * @param options - Rate limit configuration
 * @returns Middleware function that returns NextResponse if rate limited, null otherwise
 */
export function rateLimit(options: RateLimitOptions) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const { maxRequests, windowMs, identifier } = options

    // Get identifier (IP address by default)
    const id = identifier
      ? identifier(request)
      : request.ip || 
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown'

    const now = Date.now()
    const key = `${id}:${Math.floor(now / windowMs)}`
    const entry = rateLimitStore.get(key)

    if (entry && entry.resetAt > now) {
      // Entry exists and is still valid
      if (entry.count >= maxRequests) {
        // Rate limit exceeded
        const resetIn = Math.ceil((entry.resetAt - now) / 1000)
        return NextResponse.json(
          {
            error: 'Too many requests',
            message: `Rate limit exceeded. Please try again in ${resetIn} seconds.`,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(entry.resetAt).toISOString(),
              'Retry-After': resetIn.toString(),
            },
          }
        )
      }
      // Increment count
      entry.count++
    } else {
      // Create new entry
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + windowMs,
      })
    }

    // Get current entry for headers
    const currentEntry = rateLimitStore.get(key)!
    const remaining = Math.max(0, maxRequests - currentEntry.count)

    // Return null to continue (not rate limited)
    // Note: We can't set headers here since we're returning null
    // Headers should be set in the route handler if needed
    return null
  }
}

/**
 * Per-tenant rate limiter
 * Uses tenantId from context instead of IP
 */
export function tenantRateLimit(options: Omit<RateLimitOptions, 'identifier'>) {
  return async (
    request: NextRequest,
    tenantId: string
  ): Promise<NextResponse | null> => {
    const { maxRequests, windowMs } = options
    const now = Date.now()
    const key = `tenant:${tenantId}:${Math.floor(now / windowMs)}`
    const entry = rateLimitStore.get(key)

    if (entry && entry.resetAt > now) {
      if (entry.count >= maxRequests) {
        const resetIn = Math.ceil((entry.resetAt - now) / 1000)
        return NextResponse.json(
          {
            error: 'Too many requests',
            message: `Rate limit exceeded. Please try again in ${resetIn} seconds.`,
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(entry.resetAt).toISOString(),
              'Retry-After': resetIn.toString(),
            },
          }
        )
      }
      entry.count++
    } else {
      rateLimitStore.set(key, {
        count: 1,
        resetAt: now + windowMs,
      })
    }

    return null
  }
}

/**
 * Pre-configured rate limiters for common use cases
 */

// Auth endpoints: 5 attempts per minute per IP
export const authRateLimit = rateLimit({
  maxRequests: 5,
  windowMs: 60 * 1000, // 1 minute
})

// Capture endpoint: 100 requests per hour per tenant
export const captureRateLimit = tenantRateLimit({
  maxRequests: 100,
  windowMs: 60 * 60 * 1000, // 1 hour
})

// Query endpoint (AI-powered): 50 requests per hour per tenant
export const queryRateLimit = tenantRateLimit({
  maxRequests: 50,
  windowMs: 60 * 60 * 1000, // 1 hour
})
