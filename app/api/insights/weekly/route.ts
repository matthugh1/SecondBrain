import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import { generateWeeklyInsights } from '@/lib/services/insights'

export async function GET(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId, userId } = tenantCheck

    const weeklyInsights = await generateWeeklyInsights(tenantId, userId)

    return NextResponse.json(weeklyInsights)
  } catch (error) {
    console.error('Error generating weekly insights:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
