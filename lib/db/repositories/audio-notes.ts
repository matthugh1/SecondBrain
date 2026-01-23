import { prisma } from '../index'
import type { Category } from '@/types'

export interface AudioNote {
  id: number
  tenantId: string
  itemType: Category
  itemId: number
  filename: string
  filepath: string
  duration?: number
  transcription?: string
  transcriptionConfidence?: number
  transcribedAt?: Date
  createdAt: Date
}

/**
 * Create audio note
 */
export async function createAudioNote(
  tenantId: string,
  itemType: Category,
  itemId: number,
  filename: string,
  filepath: string,
  duration?: number
): Promise<number> {
  const result = await prisma.audioNote.create({
    data: {
      tenantId,
      itemType,
      itemId,
      filename,
      filepath,
      duration: duration || null,
    },
  })
  return result.id
}

/**
 * Get audio notes for item
 */
export async function getAudioNotesForItem(
  tenantId: string,
  itemType: Category,
  itemId: number
): Promise<AudioNote[]> {
  const notes = await prisma.audioNote.findMany({
    where: {
      tenantId,
      itemType,
      itemId,
    },
    orderBy: { createdAt: 'desc' },
  })

  return notes.map(note => ({
    id: note.id,
    tenantId: note.tenantId,
    itemType: note.itemType as Category,
    itemId: note.itemId,
    filename: note.filename,
    filepath: note.filepath,
    duration: note.duration || undefined,
    transcription: note.transcription || undefined,
    transcriptionConfidence: note.transcriptionConfidence || undefined,
    transcribedAt: note.transcribedAt || undefined,
    createdAt: note.createdAt,
  }))
}

/**
 * Update audio note transcription
 */
export async function updateAudioNoteTranscription(
  tenantId: string,
  audioNoteId: number,
  transcription: string,
  confidence: number
): Promise<void> {
  await prisma.audioNote.updateMany({
    where: {
      id: audioNoteId,
      tenantId,
    },
    data: {
      transcription,
      transcriptionConfidence: confidence,
      transcribedAt: new Date(),
    },
  })
}

/**
 * Delete audio note
 */
export async function deleteAudioNote(
  tenantId: string,
  audioNoteId: number
): Promise<void> {
  await prisma.audioNote.deleteMany({
    where: {
      id: audioNoteId,
      tenantId,
    },
  })
}
