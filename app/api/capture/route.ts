import { NextRequest, NextResponse } from 'next/server'
import { captureMessage } from '@/lib/services/capture'
import { requireTenant } from '@/lib/auth/utils'
import { validateRequest } from '@/lib/middleware/validate-request'
import { captureRateLimit } from '@/lib/middleware/rate-limit'
import { handleError } from '@/lib/middleware/error-handler'
import { captureSchema } from '@/lib/validation/schemas'

export async function POST(request: NextRequest) {
  try {
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
    const result = await captureMessage(tenantId, data.message, userId)
    return NextResponse.json(result)
  } catch (error) {
    return handleError(error, '/api/capture')
  }
}
