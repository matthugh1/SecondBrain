import { NextRequest, NextResponse } from 'next/server'
import { captureMessage } from '@/lib/services/capture'
import { requireTenant } from '@/lib/auth/utils'

export async function POST(request: NextRequest) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const body = await request.json()
    const { message } = body

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const result = await captureMessage(tenantId, message.trim())
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in capture API:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
