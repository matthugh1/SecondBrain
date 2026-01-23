import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import { generateDailyInsights, storeInsights, getActiveInsights } from '@/lib/services/insights'

export async function GET(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId, userId } = tenantCheck

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10', 10)
    const generate = searchParams.get('generate') === 'true'

    if (generate) {
      // Generate new insights
      const newInsights = await generateDailyInsights(tenantId, userId)
      await storeInsights(tenantId, userId, newInsights)
    }

    const insights = await getActiveInsights(tenantId, userId, limit)

    return NextResponse.json({ insights })
  } catch (error) {
    console.error('Error fetching insights:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId, userId } = tenantCheck

    // Generate and store new insights
    const insights = await generateDailyInsights(tenantId, userId)
    await storeInsights(tenantId, userId, insights)

    return NextResponse.json({ insights, count: insights.length })
  } catch (error) {
    console.error('Error generating insights:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
