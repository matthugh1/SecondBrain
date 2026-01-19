import { NextRequest, NextResponse } from 'next/server'
import {
  getCommentById,
  updateComment,
  deleteComment,
} from '@/lib/db/repositories/comments'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const comment = getCommentById(id)
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }
    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error fetching comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const id = parseInt(params.id)
    updateComment(id, body)
    const updated = getCommentById(id)
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    deleteComment(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
