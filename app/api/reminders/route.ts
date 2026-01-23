import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as remindersRepo from '@/lib/db/repositories/reminders'
import { generateAllReminders } from '@/lib/services/reminders'

export async function GET(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId, userId } = tenantCheck

    const searchParams = request.nextUrl.searchParams
    const reminderType = searchParams.get('type') || undefined
    const status = searchParams.get('status') || 'active'

    // Generate reminders first (async, don't block)
    generateAllReminders(tenantId, userId).catch(err =>
      console.error('Error generating reminders:', err)
    )

    const reminders = await remindersRepo.getActiveReminders(
      tenantId,
      userId,
      reminderType
    )

    // Filter by status if specified
    const filteredReminders = status === 'active'
      ? reminders.filter(r => r.status === 'active')
      : reminders

    return NextResponse.json({ reminders: filteredReminders })
  } catch (error) {
    console.error('Error fetching reminders:', error)
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
    const { reminderType, itemType, itemId, title, message, dueDate, priority } = body

    const reminder = await remindersRepo.createReminder(
      tenantId,
      userId,
      reminderType,
      itemType,
      itemId,
      title,
      message,
      dueDate ? new Date(dueDate) : undefined,
      priority || 'medium'
    )

    return NextResponse.json({ reminder })
  } catch (error) {
    console.error('Error creating reminder:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
