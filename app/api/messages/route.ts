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
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined
    const category = searchParams.get('category') || undefined

    const messages = await messageLogRepo.getMessageLogs(tenantId, userId!, {
      limit,
      offset,
      startDate,
      endDate,
      category,
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching message logs:', error)
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
    const { role, content, category, destinationUrl } = body

    if (!role || !content) {
      return NextResponse.json(
        { error: 'role and content are required' },
        { status: 400 }
      )
    }

    const messageId = await messageLogRepo.createMessageLog(tenantId, userId!, {
      role: role as 'user' | 'assistant' | 'system',
      content,
      category,
      destinationUrl,
    })

    return NextResponse.json({ messageId })
  } catch (error) {
    console.error('Error creating message log:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
