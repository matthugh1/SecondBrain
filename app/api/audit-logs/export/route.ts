import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import { exportAuditLogs } from '@/lib/db/repositories/audit-logs'
import { handleError } from '@/lib/middleware/error-handler'

/**
 * GET /api/audit-logs/export
 * 
 * Export audit logs for compliance (7 year retention)
 * Requires authentication
 * 
 * Query parameters:
 * - startDate: ISO date string (required)
 * - endDate: ISO date string (required)
 * - format: 'json' | 'csv' (default: 'json')
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
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')
    const format = searchParams.get('format') || 'json'

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      )
    }

    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use ISO 8601 format.' },
        { status: 400 }
      )
    }

    // Validate date range (max 1 year for export)
    const maxRange = 365 * 24 * 60 * 60 * 1000 // 1 year in milliseconds
    if (endDate.getTime() - startDate.getTime() > maxRange) {
      return NextResponse.json(
        { error: 'Date range cannot exceed 1 year. Please export in smaller chunks.' },
        { status: 400 }
      )
    }

    const logs = await exportAuditLogs(tenantId, startDate, endDate)

    if (format === 'csv') {
      // Generate CSV
      const headers = ['id', 'timestamp', 'userId', 'actionType', 'resource', 'resourceId', 'ipAddress', 'userAgent']
      const rows = logs.map(log => [
        log.id,
        log.timestamp.toISOString(),
        log.userId || '',
        log.actionType,
        log.resource,
        log.resourceId || '',
        log.ipAddress || '',
        log.userAgent || '',
      ])

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${tenantId}-${startDateStr}-${endDateStr}.csv"`,
        },
      })
    }

    // Default: JSON format
    return NextResponse.json({
      tenantId,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      count: logs.length,
      logs,
    })
  } catch (error) {
    return handleError(error, '/api/audit-logs/export')
  }
}
