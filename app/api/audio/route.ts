import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as audioNotesRepo from '@/lib/db/repositories/audio-notes'
import type { Category } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const searchParams = request.nextUrl.searchParams
    const itemType = searchParams.get('itemType') as Category
    const itemId = parseInt(searchParams.get('itemId') || '0', 10)

    if (!itemType || !itemId) {
      return NextResponse.json(
        { error: 'itemType and itemId are required' },
        { status: 400 }
      )
    }

    const notes = await audioNotesRepo.getAudioNotesForItem(tenantId, itemType, itemId)

    return NextResponse.json({
      notes: notes.map(note => ({
        id: note.id,
        itemType: note.itemType,
        itemId: note.itemId,
        audioUrl: `/api/attachments/${note.filepath}`,
        transcription: note.transcription || undefined,
        transcriptionConfidence: note.transcriptionConfidence || undefined,
        duration: note.duration || undefined,
        createdAt: note.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error('Error fetching audio notes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
