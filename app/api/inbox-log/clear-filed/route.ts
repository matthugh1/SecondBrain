import { NextResponse } from 'next/server'
import { deleteInboxLogsByStatus } from '@/lib/db/repositories/inbox-log'

export async function POST() {
  try {
    const removed = deleteInboxLogsByStatus('Filed')
    return NextResponse.json({ success: true, removed })
  } catch (error) {
    console.error('Error clearing filed items:', error)
    return NextResponse.json(
      { error: 'Failed to clear filed items' },
      { status: 500 }
    )
  }
}
