import { NextRequest, NextResponse } from 'next/server'
import { getAllInboxLogs } from '@/lib/db/repositories/inbox-log'
import { requireTenant } from '@/lib/auth/utils'

export async function GET(request: NextRequest) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const { searchParams } = new URL(request.url)
    const database = searchParams.get('database')
    const itemId = searchParams.get('itemId')

    if (!database || !itemId) {
      return NextResponse.json(
        { error: 'database and itemId are required' },
        { status: 400 }
      )
    }

    const logs = await getAllInboxLogs(tenantId)
    
    // Find the log entry that created this item
    const log = logs.find((l) => {
      if (l.notion_record_id === itemId && l.filed_to === database) {
        return true
      }
      // Also check by destination URL pattern
      if (l.destination_url && l.destination_url.includes(`/${database}/${itemId}`)) {
        return true
      }
      return false
    })

    if (!log) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(log)
  } catch (error) {
    console.error('Error fetching inbox log by item:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
