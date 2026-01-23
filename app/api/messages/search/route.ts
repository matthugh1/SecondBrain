import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as messageLogRepo from '@/lib/db/repositories/message-log'

export async function GET(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId, userId } = tenantCheck

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    if (!query) {
      return NextResponse.json({ messages: [] })
    }

    const messages = await messageLogRepo.searchMessageLogs(tenantId, userId!, query, limit)

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error searching message logs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
