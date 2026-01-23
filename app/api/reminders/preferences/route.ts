import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as remindersRepo from '@/lib/db/repositories/reminders'

export async function GET(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId, userId } = tenantCheck

    const preferences = await remindersRepo.getReminderPreferences(tenantId, userId)

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Error fetching reminder preferences:', error)
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
    const { tenantId, userId } = tenantCheck

    const body = await request.json()
    const { reminderType, ...preference } = body

    if (!reminderType) {
      return NextResponse.json(
        { error: 'reminderType is required' },
        { status: 400 }
      )
    }

    await remindersRepo.updateReminderPreference(tenantId, userId, reminderType, preference)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating reminder preference:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
