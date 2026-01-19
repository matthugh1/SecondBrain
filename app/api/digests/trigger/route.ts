import { NextResponse } from 'next/server'
import { generateDailyDigest } from '@/lib/services/digest'
import { requireTenant } from '@/lib/auth/utils'

export async function POST() {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }

  const { tenantId } = tenantCheck

  try {
    await generateDailyDigest(tenantId)
    return NextResponse.json({ 
      success: true, 
      message: 'Daily digest generated successfully' 
    })
  } catch (error) {
    console.error('Error triggering daily digest:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error details:', { errorMessage, errorStack })
    
    return NextResponse.json(
      { 
        error: 'Failed to generate daily digest',
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack })
      },
      { status: 500 }
    )
  }
}
