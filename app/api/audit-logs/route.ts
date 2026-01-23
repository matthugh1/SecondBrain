import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import { searchAuditLogs, getAuditLogStats } from '@/lib/db/repositories/audit-logs'
import { handleError } from '@/lib/middleware/error-handler'
import { validateRequest } from '@/lib/middleware/validate-request'
import { z } from 'zod'

const searchAuditLogsSchema = z.object({
  userId: z.string().optional(),
  actionType: z.string().optional(),
  resource: z.string().optional(),
  resourceId: z.number().int().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  limit: z.number().int().min(1).max(1000).optional(),
  offset: z.number().int().min(0).optional(),
})

/**
 * GET /api/audit-logs
 * 
 * Search audit logs with filters
 * Requires authentication
 */
export async function GET(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }

    const { tenantId } = tenantCheck

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryParams: Record<string, any> = {}
    
    if (searchParams.get('userId')) queryParams.userId = searchParams.get('userId')
    if (searchParams.get('actionType')) queryParams.actionType = searchParams.get('actionType')
    if (searchParams.get('resource')) queryParams.resource = searchParams.get('resource')
    if (searchParams.get('resourceId')) queryParams.resourceId = searchParams.get('resourceId')
    if (searchParams.get('startDate')) queryParams.startDate = searchParams.get('startDate')
    if (searchParams.get('endDate')) queryParams.endDate = searchParams.get('endDate')
    if (searchParams.get('limit')) queryParams.limit = searchParams.get('limit')
    if (searchParams.get('offset')) queryParams.offset = searchParams.get('offset')

    // Validate query parameters (Zod will coerce types)
    const validation = searchAuditLogsSchema.safeParse(queryParams)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      )
    }

    const logs = await searchAuditLogs({
      tenantId,
      ...validation.data,
    })

    // Get statistics if requested
    const includeStats = searchParams.get('includeStats') === 'true'
    let stats = null
    if (includeStats) {
      stats = await getAuditLogStats(
        tenantId,
        validation.data.startDate,
        validation.data.endDate
      )
    }

    return NextResponse.json({
      logs,
      count: logs.length,
      ...(stats && { stats }),
    })
  } catch (error) {
    return handleError(error, '/api/audit-logs')
  }
}
