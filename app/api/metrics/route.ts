import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import { getAllMetrics, getMetricsStats } from '@/lib/metrics'
import { handleError } from '@/lib/middleware/error-handler'

/**
 * GET /api/metrics
 * 
 * Returns metrics data for monitoring and observability
 * Requires authentication
 */
export async function GET(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const metricName = searchParams.get('name')
    const labelsParam = searchParams.get('labels')

    if (metricName) {
      // Return stats for specific metric
      const labels = labelsParam ? JSON.parse(labelsParam) : undefined
      const stats = getMetricsStats(metricName, labels)
      
      if (!stats) {
        return NextResponse.json(
          { error: 'Metric not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        name: metricName,
        labels,
        ...stats,
      })
    }

    // Return all metrics
    const allMetrics = getAllMetrics()
    
    // Calculate summary statistics
    const summary = {
      totalMetrics: allMetrics.length,
      totalDataPoints: allMetrics.reduce((sum, m) => sum + m.points.length, 0),
      metrics: allMetrics.map(m => ({
        name: m.name,
        type: m.type,
        dataPointCount: m.points.length,
        labels: m.labels,
        stats: getMetricsStats(m.name, m.labels),
      })),
    }

    return NextResponse.json(summary)
  } catch (error) {
    return handleError(error, '/api/metrics')
  }
}
