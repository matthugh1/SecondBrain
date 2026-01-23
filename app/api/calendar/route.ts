import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as calendarRepo from '@/lib/db/repositories/calendar'

export async function GET(request: NextRequest) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }

  const { tenantId } = tenantCheck
  const searchParams = request.nextUrl.searchParams

  try {
    const today = searchParams.get('today') === 'true'
    const upcoming = searchParams.get('upcoming')
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    let events

    if (today) {
      events = await calendarRepo.getTodaysMeetings(tenantId)
    } else if (upcoming) {
      const limit = parseInt(upcoming) || 5
      events = await calendarRepo.getUpcomingMeetings(tenantId, limit)
    } else {
      const startDate = startDateParam ? new Date(startDateParam) : undefined
      const endDate = endDateParam ? new Date(endDateParam) : undefined
      events = await calendarRepo.getCalendarEvents(tenantId, startDate, endDate)
    }

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error details:', errorMessage, error)
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }

  const { tenantId } = tenantCheck

  try {
    const body = await request.json()
    const { subject, startTime, endTime, location, attendees, description, isAllDay } = body

    if (!subject || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'subject, startTime, and endTime are required' },
        { status: 400 }
      )
    }

    const event = await calendarRepo.createCalendarEvent(tenantId, {
      subject,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      location,
      attendees,
      description,
      isAllDay: isAllDay || false,
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error) {
    console.error('Error creating calendar event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
