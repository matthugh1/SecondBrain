import { NextRequest, NextResponse } from 'next/server'
import { captureMessage } from '@/lib/services/capture'
import { requireTenant } from '@/lib/auth/utils'
import { validateRequest } from '@/lib/middleware/validate-request'
import { captureRateLimit } from '@/lib/middleware/rate-limit'
import { handleError } from '@/lib/middleware/error-handler'
import { captureSchema } from '@/lib/validation/schemas'
import { setupRequestContext, addRequestIdToResponse } from '@/lib/middleware/request-id'
import { setRequestContext } from '@/lib/logger/context'
import { withMetrics } from '@/lib/middleware/metrics'

export const POST = withMetrics(async (request: NextRequest) => {
  try {
    // Set up request context for logging
    const requestId = setupRequestContext(request)
    
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    
    const { tenantId, userId } = tenantCheck

    // Rate limiting: 100 requests per hour per tenant
    const rateLimitCheck = await captureRateLimit(request, tenantId)
    if (rateLimitCheck) {
      return rateLimitCheck
    }

    // Validate request body
    const validation = await validateRequest(captureSchema, request)
    if (!validation.success) {
      return validation.response
    }

    const { data } = validation
    
    // Update request context with tenant/user info
    setRequestContext({
      requestId,
      tenantId,
      userId,
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0] || 
                 request.headers.get('x-real-ip') || 
                 undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    })
    
    const result = await captureMessage(tenantId, data.message, userId)
    const response = NextResponse.json(result)
    return addRequestIdToResponse(response, requestId)
  } catch (error) {
    return handleError(error, '/api/capture')
  }
})
