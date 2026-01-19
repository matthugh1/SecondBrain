import { NextRequest, NextResponse } from 'next/server'
import { detectTaskQueryIntent } from '@/lib/services/intent-detection'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message } = body

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    const intentResult = await detectTaskQueryIntent(message.trim())
    return NextResponse.json(intentResult)
  } catch (error) {
    console.error('Error detecting intent:', error)
    return NextResponse.json(
      { error: 'Internal server error', isQuery: false },
      { status: 500 }
    )
  }
}
