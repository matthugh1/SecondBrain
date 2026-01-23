import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import { generateRelationshipInsights, getItemInsights } from '@/lib/services/relationship-insights'
import type { Category } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const searchParams = request.nextUrl.searchParams
    const itemType = searchParams.get('itemType') as Category | null
    const itemId = searchParams.get('itemId')

    if (itemType && itemId) {
      // Get insights for specific item
      const insights = await getItemInsights(tenantId, itemType, parseInt(itemId, 10))
      return NextResponse.json({ insights })
    } else {
      // Get general insights
      const insights = await generateRelationshipInsights(tenantId)
      return NextResponse.json({ insights })
    }
  } catch (error) {
    console.error('Error generating relationship insights:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
