import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as audioNotesRepo from '@/lib/db/repositories/audio-notes'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const noteId = parseInt(params.id, 10)
    await audioNotesRepo.deleteAudioNote(tenantId, noteId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting audio note:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const noteId = parseInt(params.id, 10)
    const body = await request.json()
    
    if (body.transcription !== undefined) {
      await audioNotesRepo.updateAudioNoteTranscription(
        tenantId,
        noteId,
        body.transcription,
        body.confidence || 1.0
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating audio note:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
