import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import { executeQuery } from '@/lib/services/query-engine'
import { saveQueryHistory } from '@/lib/db/repositories/query-history'
import { validateRequest } from '@/lib/middleware/validate-request'
import { handleError } from '@/lib/middleware/error-handler'
import { queryRateLimit } from '@/lib/middleware/rate-limit'
import { querySchema } from '@/lib/validation/schemas'

export async function POST(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    // Rate limiting: 50 requests per hour per tenant (AI endpoint)
    const rateLimitCheck = await queryRateLimit(request, tenantId)
    if (rateLimitCheck) {
      return rateLimitCheck
    }

    // Validate request body
    const validation = await validateRequest(querySchema, request)
    if (!validation.success) {
      return validation.response
    }

    const { data } = validation
    const query = data.query || data.message || ''

    const result = await executeQuery(tenantId, query.trim())

    // Save to query history (async, don't block)
    saveQueryHistory(tenantId, query.trim(), result.total_results).catch(err => 
      console.error('Error saving query history:', err)
    )

    return NextResponse.json(result)
  } catch (error) {
    return handleError(error, '/api/query')
  }
}

export async function GET(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    // Rate limiting: 50 requests per hour per tenant (AI endpoint)
    const rateLimitCheck = await queryRateLimit(request, tenantId)
    if (rateLimitCheck) {
      return rateLimitCheck
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter q is required' },
        { status: 400 }
      )
    }

    const result = await executeQuery(tenantId, query.trim())

    // Save to query history (async, don't block)
    saveQueryHistory(tenantId, query.trim(), result.total_results).catch(err => 
      console.error('Error saving query history:', err)
    )

    return NextResponse.json(result)
  } catch (error) {
    return handleError(error, '/api/query')
  }
}
