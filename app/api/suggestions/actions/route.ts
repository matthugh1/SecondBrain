import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import { generateActionSuggestions } from '@/lib/services/suggestions'

export async function GET(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId, userId } = tenantCheck

    const suggestions = await generateActionSuggestions(tenantId, userId!)

    return NextResponse.json({
      suggestions: suggestions.map((s, idx) => ({
        id: idx + 1,
        type: s.type,
        action: s.action.type,
        description: s.description,
        priority: s.priority === 'high' ? 0.9 : s.priority === 'medium' ? 0.6 : 0.3,
        targetType: s.action.targetType,
        targetId: s.action.targetId,
      })),
    })
  } catch (error) {
    console.error('Error fetching action suggestions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
