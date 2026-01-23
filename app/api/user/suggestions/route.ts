import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import { getPersonalizedSuggestions } from '@/lib/db/repositories/user-profile'

export async function POST(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId, userId } = tenantCheck

    const body = await request.json()
    const { inputText } = body

    if (!inputText || typeof inputText !== 'string') {
      return NextResponse.json(
        { error: 'inputText is required' },
        { status: 400 }
      )
    }

    const suggestions = await getPersonalizedSuggestions(tenantId, userId, inputText)

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Error getting suggestions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
