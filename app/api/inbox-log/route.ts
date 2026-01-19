import { NextRequest, NextResponse } from 'next/server'
import { getAllInboxLogs, getInboxLogsByStatus } from '@/lib/db/repositories/inbox-log'
import { requireTenant } from '@/lib/auth/utils'

export async function GET(request: NextRequest) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let logs
    if (status) {
      logs = await getInboxLogsByStatus(tenantId, status as any)
    } else {
      logs = await getAllInboxLogs(tenantId)
    }

    return NextResponse.json(logs)
  } catch (error) {
    console.error('Error fetching inbox log:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
