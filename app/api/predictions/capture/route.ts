import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import { predictNextCapture } from '@/lib/services/predictions'

export async function GET(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId, userId } = tenantCheck

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 401 }
      )
    }

    const predictions = await predictNextCapture(tenantId, userId)

    return NextResponse.json({
      predictions: predictions.map(p => ({
        type: p.category,
        content: p.text,
        confidence: p.confidence,
        category: p.category,
      })),
    })
  } catch (error: any) {
    console.error('Error fetching capture predictions:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
