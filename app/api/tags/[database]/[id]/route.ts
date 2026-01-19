import { NextRequest, NextResponse } from 'next/server'
import * as tagsRepo from '@/lib/db/repositories/tags'
import { requireTenant } from '@/lib/auth/utils'
import type { Category } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { database: string; id: string } }
) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const { database, id } = params
    const itemId = parseInt(id, 10)

    if (!['people', 'projects', 'ideas', 'admin'].includes(database)) {
      return NextResponse.json(
        { error: 'Invalid database' },
        { status: 400 }
      )
    }

    const tags = await tagsRepo.getTagsForItem(tenantId, database as Category, itemId)
    return NextResponse.json({ tags })
  } catch (error) {
    console.error('Error fetching item tags:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { database: string; id: string } }
) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const { database, id } = params
    const itemId = parseInt(id, 10)
    const body = await request.json()
    const { tags } = body

    if (!['people', 'projects', 'ideas', 'admin'].includes(database)) {
      return NextResponse.json(
        { error: 'Invalid database' },
        { status: 400 }
      )
    }

    const tagNames = Array.isArray(tags) ? tags : (tags || '').split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
    await tagsRepo.setTagsForItem(tenantId, database as Category, itemId, tagNames)
    
    const updatedTags = await tagsRepo.getTagsForItem(tenantId, database as Category, itemId)
    return NextResponse.json({ tags: updatedTags })
  } catch (error) {
    console.error('Error updating item tags:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
