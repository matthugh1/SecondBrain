import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as relationshipsRepo from '@/lib/db/repositories/relationships'
import type { Category } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { database: string; id: string } }
) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const { database, id } = params
    const itemId = parseInt(id, 10)

    if (!['people', 'projects', 'ideas', 'admin'].includes(database)) {
      return NextResponse.json(
        { error: 'Invalid database' },
        { status: 400 }
      )
    }

    const relatedItems = await relationshipsRepo.getRelatedItems(
      tenantId,
      database as Category,
      itemId
    )

    return NextResponse.json({ related: relatedItems })
  } catch (error) {
    console.error('Error fetching relationships:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { database: string; id: string } }
) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const { database, id } = params
    const sourceId = parseInt(id, 10)
    const body = await request.json()
    const { targetType, targetId, relationshipType } = body

    if (!['people', 'projects', 'ideas', 'admin'].includes(database)) {
      return NextResponse.json(
        { error: 'Invalid source database' },
        { status: 400 }
      )
    }

    if (!['people', 'projects', 'ideas', 'admin'].includes(targetType)) {
      return NextResponse.json(
        { error: 'Invalid target database' },
        { status: 400 }
      )
    }

    const relationship = await relationshipsRepo.upsertRelationship(
      tenantId,
      database as Category,
      sourceId,
      targetType as Category,
      targetId,
      relationshipType || 'related_to',
      0.5
    )

    return NextResponse.json({ relationship })
  } catch (error) {
    console.error('Error creating relationship:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { database: string; id: string } }
) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const { database, id } = params
    const sourceId = parseInt(id, 10)
    const searchParams = request.nextUrl.searchParams
    const targetType = searchParams.get('targetType')
    const targetId = searchParams.get('targetId')

    if (!targetType || !targetId) {
      return NextResponse.json(
        { error: 'targetType and targetId are required' },
        { status: 400 }
      )
    }

    await relationshipsRepo.deleteRelationship(
      tenantId,
      database as Category,
      sourceId,
      targetType as Category,
      parseInt(targetId, 10)
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting relationship:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
