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

    // Use predictions service to generate pattern-based recommendations
    const predictions = await predictNextCapture(tenantId, userId!)

    // Convert predictions to pattern recommendations format
    const recommendations = predictions
      .filter(p => p.confidence > 0.5)
      .map(p => ({
        pattern: `Frequent ${p.category} captures`,
        insight: `You frequently capture ${p.category} items at this time.`,
        recommendation: `Consider setting up a reminder or template for ${p.category} captures.`,
        confidence: p.confidence,
      }))

    return NextResponse.json({ recommendations })
  } catch (error) {
    console.error('Error fetching pattern recommendations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
