import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import { generateTimeBlockSuggestions, createEventFromSuggestion } from '@/lib/services/time-blocking'

export async function GET(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const searchParams = request.nextUrl.searchParams
    const workingHoursStart = searchParams.get('workingHoursStart') || '09:00'
    const workingHoursEnd = searchParams.get('workingHoursEnd') || '17:00'

    const suggestions = await generateTimeBlockSuggestions(tenantId, {
      start: workingHoursStart,
      end: workingHoursEnd,
    })

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Error generating time block suggestions:', error)
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
    const { tenantId } = tenantCheck

    const body = await request.json()
    const { suggestion } = body

    if (!suggestion) {
      return NextResponse.json(
        { error: 'suggestion is required' },
        { status: 400 }
      )
    }

    const result = await createEventFromSuggestion(tenantId, suggestion)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to create event' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, eventId: result.eventId })
  } catch (error: any) {
    console.error('Error creating event from suggestion:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
