import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import { generateAllReminders } from '@/lib/services/reminders'

export async function POST(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId, userId } = tenantCheck

    // Generate all reminders
    await generateAllReminders(tenantId, userId)

    return NextResponse.json({ success: true, message: 'Reminders generated' })
  } catch (error) {
    console.error('Error generating reminders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
