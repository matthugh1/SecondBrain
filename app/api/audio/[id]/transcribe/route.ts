import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as audioNotesRepo from '@/lib/db/repositories/audio-notes'
import { transcribeAudio, transcribeAudioFromUrl } from '@/lib/services/audio-transcription'
import { prisma } from '@/lib/db/index'
import fs from 'fs/promises'
import path from 'path'

export async function POST(
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
    const note = await audioNotesRepo.getAudioNotesForItem(tenantId, 'admin', 0)
      .then(notes => notes.find(n => n.id === noteId))

    if (!note) {
      return NextResponse.json(
        { error: 'Audio note not found' },
        { status: 404 }
      )
    }

    // Transcribe audio
    let transcriptionResult
    if (note.filepath.startsWith('http')) {
      transcriptionResult = await transcribeAudioFromUrl(note.filepath)
    } else {
      // Read local file
      const fileBuffer = await fs.readFile(note.filepath)
      const filename = path.basename(note.filepath) || 'audio.mp3'
      transcriptionResult = await transcribeAudio(fileBuffer, filename)
    }
    
    // Update note with transcription
    await audioNotesRepo.updateAudioNoteTranscription(
      tenantId,
      noteId,
      transcriptionResult.transcription,
      transcriptionResult.confidence || 0.9
    )

    return NextResponse.json({
      transcription: transcriptionResult.transcription,
      confidence: transcriptionResult.confidence || 0.9,
    })
  } catch (error) {
    console.error('Error transcribing audio:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
