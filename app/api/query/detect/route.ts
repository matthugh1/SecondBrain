import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import { detectGeneralQueryIntent } from '@/lib/services/intent-detection'

export async function POST(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }

    const body = await request.json()
    const message = body.message || body.query || ''

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const isQuery = await detectGeneralQueryIntent(message.trim())

    return NextResponse.json({ isQuery })
  } catch (error) {
    console.error('Error detecting query intent:', error)
    return NextResponse.json(
      { error: 'Internal server error', isQuery: false },
      { status: 500 }
    )
  }
}
