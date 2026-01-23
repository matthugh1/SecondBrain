import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'

export async function POST(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }

    const body = await request.json()
    const { pattern, useful } = body

    // In a real implementation, you'd store this feedback to improve recommendations
    // For now, we just return success
    console.log(`Feedback for pattern "${pattern}": ${useful ? 'useful' : 'not useful'}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error submitting feedback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
