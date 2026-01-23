import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { setRequestContext, getRequestContext } from '@/lib/logger/context'

/**
 * Generate or extract request ID from headers
 * Adds X-Request-ID header if not present
 */
export function getOrCreateRequestId(request: NextRequest): string {
  // Check if request ID already exists in headers
  const existingRequestId = request.headers.get('x-request-id')
  if (existingRequestId) {
    return existingRequestId
  }

  // Generate new request ID
  return uuidv4()
}

/**
 * Set up request context for an API route handler
 * Call this at the start of each API route handler
 */
export function setupRequestContext(request: NextRequest): string {
  const requestId = getOrCreateRequestId(request)
  
  // Set up request context for logging
  setRequestContext({
    requestId,
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               undefined,
    userAgent: request.headers.get('user-agent') || undefined,
  })

  return requestId
}

/**
 * Add request ID to response headers
 * Call this before returning a response
 */
export function addRequestIdToResponse(response: NextResponse, requestId: string): NextResponse {
  response.headers.set('X-Request-ID', requestId)
  return response
}

/**
 * Get request ID from current context (for use in routes/services)
 */
export function getRequestId(): string | undefined {
  const context = getRequestContext()
  return context?.requestId
}
