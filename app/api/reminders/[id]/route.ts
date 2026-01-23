import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as remindersRepo from '@/lib/db/repositories/reminders'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId, userId } = tenantCheck

    const reminderId = parseInt(params.id, 10)
    const body = await request.json()
    const { status, snoozedUntil } = body

    if (!status || !['active', 'snoozed', 'dismissed', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required' },
        { status: 400 }
      )
    }

    await remindersRepo.updateReminderStatus(
      tenantId,
      userId,
      reminderId,
      status,
      snoozedUntil ? new Date(snoozedUntil) : undefined
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating reminder:', error)
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
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId, userId } = tenantCheck

    const reminderId = parseInt(params.id, 10)

    await remindersRepo.deleteReminder(tenantId, userId, reminderId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting reminder:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
