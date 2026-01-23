import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import { syncTaskToCalendar, syncCalendarToSecondBrain } from '@/lib/services/calendar-sync'

export async function POST(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const body = await request.json()
    const { direction, taskId } = body

    if (direction === 'to_calendar' && taskId) {
      // Sync specific task to calendar
      const result = await syncTaskToCalendar(tenantId, taskId)
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Sync failed' },
          { status: 500 }
        )
      }
      return NextResponse.json({ success: true, eventId: result.eventId })
    }

    if (direction === 'from_calendar') {
      // Sync calendar events to Second Brain
      const result = await syncCalendarToSecondBrain(tenantId)
      return NextResponse.json({
        success: result.errors.length === 0,
        synced: result.synced,
        errors: result.errors,
      })
    }

    return NextResponse.json(
      { error: 'Must specify direction (to_calendar or from_calendar) and taskId for to_calendar' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error syncing calendar:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
