import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as calendarRepo from '@/lib/db/repositories/calendar'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }

  const { tenantId } = tenantCheck
  const eventId = parseInt(params.id)

  if (isNaN(eventId)) {
    return NextResponse.json(
      { error: 'Invalid event ID' },
      { status: 400 }
    )
  }

  try {
    const body = await request.json()
    const { subject, startTime, endTime, location, attendees, description, isAllDay } = body

    const updateData: any = {}
    if (subject !== undefined) updateData.subject = subject
    if (startTime !== undefined) updateData.startTime = new Date(startTime)
    if (endTime !== undefined) updateData.endTime = new Date(endTime)
    if (location !== undefined) updateData.location = location
    if (attendees !== undefined) updateData.attendees = attendees
    if (description !== undefined) updateData.description = description
    if (isAllDay !== undefined) updateData.isAllDay = isAllDay

    const event = await calendarRepo.updateCalendarEvent(tenantId, eventId, updateData)

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ event })
  } catch (error) {
    console.error('Error updating calendar event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }

  const { tenantId } = tenantCheck
  const eventId = parseInt(params.id)

  if (isNaN(eventId)) {
    return NextResponse.json(
      { error: 'Invalid event ID' },
      { status: 400 }
    )
  }

  try {
    const deleted = await calendarRepo.deleteCalendarEvent(tenantId, eventId)

    if (!deleted) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting calendar event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
