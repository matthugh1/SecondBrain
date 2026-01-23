import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import * as audioNotesRepo from '@/lib/db/repositories/audio-notes'
import { transcribeAudio } from '@/lib/services/audio-transcription'

export async function POST(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const itemType = formData.get('itemType') as string
    const itemId = parseInt(formData.get('itemId') as string, 10)
    const autoTranscribe = formData.get('autoTranscribe') === 'true'

    if (!audioFile || !itemType || !itemId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Save audio file
    const uploadsDir = join(process.cwd(), 'uploads', 'audio', tenantId)
    await mkdir(uploadsDir, { recursive: true })

    const filename = `${Date.now()}-${audioFile.name}`
    const filepath = join(uploadsDir, filename)
    const bytes = await audioFile.arrayBuffer()
    const buffer = Buffer.from(bytes)

    await writeFile(filepath, buffer)

    // Calculate duration (approximate)
    const duration = Math.floor(buffer.length / 16000) // Rough estimate

    // Create audio note record
    const audioNoteId = await audioNotesRepo.createAudioNote(
      tenantId,
      itemType as any,
      itemId,
      filename,
      `/uploads/audio/${tenantId}/${filename}`,
      duration
    )

    // Auto-transcribe if requested
    let transcription: string | undefined
    let confidence: number | undefined

    if (autoTranscribe) {
      try {
        const result = await transcribeAudio(buffer, filename)
        transcription = result.transcription
        confidence = result.confidence

        await audioNotesRepo.updateAudioNoteTranscription(
          tenantId,
          audioNoteId,
          transcription,
          confidence
        )
      } catch (error) {
        console.error('Error transcribing audio:', error)
        // Continue without transcription
      }
    }

    return NextResponse.json({
      success: true,
      audioNoteId,
      filename,
      filepath: `/uploads/audio/${tenantId}/${filename}`,
      duration,
      transcription,
      confidence,
    })
  } catch (error) {
    console.error('Error uploading audio:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
