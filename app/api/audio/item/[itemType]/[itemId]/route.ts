import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as audioNotesRepo from '@/lib/db/repositories/audio-notes'

export async function GET(
  request: NextRequest,
  { params }: { params: { itemType: string; itemId: string } }
) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const itemId = parseInt(params.itemId, 10)
    const audioNotes = await audioNotesRepo.getAudioNotesForItem(
      tenantId,
      params.itemType as any,
      itemId
    )

    return NextResponse.json({ audioNotes })
  } catch (error) {
    console.error('Error fetching audio notes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
