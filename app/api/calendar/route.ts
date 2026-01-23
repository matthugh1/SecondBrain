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

    // #region agent log
    const fs = require('fs')
    try{const logPath='/Users/matthewhughes/Documents/App_Folder/SecondBrain/.cursor/debug.log';const logEntry={location:'app/api/calendar/route.ts:14',message:'Calendar API GET request',data:{tenantId,today,upcoming,startDateParam,endDateParam},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'F'};fs.appendFileSync(logPath,JSON.stringify(logEntry)+'\n');}catch(e){}
    // #endregion

    let events

    if (today) {
      events = await calendarRepo.getTodaysMeetings(tenantId)
    } else if (upcoming) {
      const limit = parseInt(upcoming) || 5
      events = await calendarRepo.getUpcomingMeetings(tenantId, limit)
    } else {
      const startDate = startDateParam ? new Date(startDateParam) : undefined
      const endDate = endDateParam ? new Date(endDateParam) : undefined
      // #region agent log
      try{const logPath='/Users/matthewhughes/Documents/App_Folder/SecondBrain/.cursor/debug.log';const logEntry={location:'app/api/calendar/route.ts:28',message:'Fetching events with date range',data:{tenantId,startDate:startDate?.toISOString(),endDate:endDate?.toISOString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'F'};fs.appendFileSync(logPath,JSON.stringify(logEntry)+'\n');}catch(e){}
      // #endregion
      events = await calendarRepo.getCalendarEvents(tenantId, startDate, endDate)
      // #region agent log
      try{const logPath='/Users/matthewhughes/Documents/App_Folder/SecondBrain/.cursor/debug.log';const logEntry={location:'app/api/calendar/route.ts:31',message:'Events fetched from repository',data:{eventsCount:events.length,firstEvent:events[0]?{id:events[0].id,subject:events[0].subject,startTime:events[0].startTime.toISOString()}:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'F'};fs.appendFileSync(logPath,JSON.stringify(logEntry)+'\n');}catch(e){}
      // #endregion
    }

    // #region agent log
    try{const logPath='/Users/matthewhughes/Documents/App_Folder/SecondBrain/.cursor/debug.log';const logEntry={location:'app/api/calendar/route.ts:33',message:'Returning events response',data:{eventsCount:events.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'F'};fs.appendFileSync(logPath,JSON.stringify(logEntry)+'\n');}catch(e){}
    // #endregion
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
