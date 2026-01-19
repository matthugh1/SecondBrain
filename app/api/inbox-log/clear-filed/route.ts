import { NextResponse } from 'next/server'
import { deleteInboxLogsByStatus } from '@/lib/db/repositories/inbox-log'
import { requireTenant } from '@/lib/auth/utils'

export async function POST() {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const removed = await deleteInboxLogsByStatus(tenantId, 'Filed')
    return NextResponse.json({ success: true, removed })
  } catch (error) {
    console.error('Error clearing filed items:', error)
    return NextResponse.json(
      { error: 'Failed to clear filed items' },
      { status: 500 }
    )
  }
}
