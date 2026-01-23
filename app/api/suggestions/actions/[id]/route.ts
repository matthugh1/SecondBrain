import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // This is a simple dismiss endpoint - in a real app you'd store dismissed suggestions
  // For now, we just return success
  return NextResponse.json({ success: true })
}
