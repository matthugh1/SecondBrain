import { NextRequest, NextResponse } from 'next/server'
import { getTokenUsageStats, getRecentTokenUsage, type TokenUsageProvider, type TokenUsageOperationType } from '@/lib/db/repositories/token-usage'
import { requireTenant } from '@/lib/auth/utils'
import { calculateCost } from '@/lib/utils/pricing'

export async function GET(request: NextRequest) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }

  const { tenantId } = tenantCheck

  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all' // 'day' | 'week' | 'month' | 'all'
    const provider = searchParams.get('provider') as TokenUsageProvider | null
    const operationType = searchParams.get('operationType') as TokenUsageOperationType | null
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // Calculate date range based on period
    let startDate: Date | undefined
    let endDate: Date | undefined

    if (startDateParam) {
      startDate = new Date(startDateParam)
    } else if (period !== 'all') {
      const now = new Date()
      endDate = now

      switch (period) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
      }
    }

    if (endDateParam) {
      endDate = new Date(endDateParam)
    }

    // Build query
    const query: any = {}
    if (startDate) query.startDate = startDate
    if (endDate) query.endDate = endDate
    if (provider) query.provider = provider
    if (operationType) query.operationType = operationType

    // Get aggregated stats
    const stats = await getTokenUsageStats(tenantId, query)

    // Get recent records
    const recent = await getRecentTokenUsage(tenantId, limit, query)

    return NextResponse.json({
      ...stats,
      period,
      recent: recent.map((r) => ({
        ...r,
        created: r.created.toISOString(),
        cost: calculateCost(r.model, r.promptTokens, r.completionTokens),
      })),
    })
  } catch (error) {
    console.error('Error fetching token usage:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: errorStack,
    } : { error: String(error) }
    
    console.error('Error details:', errorDetails)
    
    return NextResponse.json(
      {
        error: 'Failed to fetch token usage',
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { 
          stack: errorStack,
          details: errorDetails 
        }),
      },
      { status: 500 }
    )
  }
}
