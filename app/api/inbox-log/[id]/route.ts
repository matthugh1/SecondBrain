import { NextRequest, NextResponse } from 'next/server'
import { deleteInboxLog } from '@/lib/db/repositories/inbox-log'
import { requireTenant } from '@/lib/auth/utils'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      )
    }

    await deleteInboxLog(tenantId, id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting inbox log:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
