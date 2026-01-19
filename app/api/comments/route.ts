import { NextRequest, NextResponse } from 'next/server'
import {
  getCommentsByItem,
  createComment,
} from '@/lib/db/repositories/comments'
import { requireTenant } from '@/lib/auth/utils'

export async function GET(request: NextRequest) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const { searchParams } = new URL(request.url)
    const itemType = searchParams.get('itemType')
    const itemId = searchParams.get('itemId')
    const fieldKey = searchParams.get('fieldKey')

    if (!itemType || !itemId) {
      return NextResponse.json(
        { error: 'itemType and itemId required' },
        { status: 400 }
      )
    }

    const comments = await getCommentsByItem(tenantId, itemType, parseInt(itemId), fieldKey || undefined)
    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const body = await request.json()
    const id = await createComment(tenantId, body)
    return NextResponse.json({ id, ...body }, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
