import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import {
  getRecentCorrections,
  getCorrectionCount,
  getAllCorrections
} from '@/lib/db/repositories/classification-learning'

export async function GET(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    
    const { tenantId } = tenantCheck
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const daysBack = parseInt(searchParams.get('days') || '365', 10)

    // Verify imports
    if (!getAllCorrections) {
      throw new Error('getAllCorrections function not imported')
    }
    if (typeof getAllCorrections !== 'function') {
      throw new Error(`getAllCorrections is not a function, got ${typeof getAllCorrections}`)
    }
    
    const [corrections, total] = await Promise.all([
      getAllCorrections(tenantId, limit, offset, daysBack),
      getCorrectionCount(tenantId),
    ])

    return NextResponse.json({
      corrections,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching corrections:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    const errorName = error instanceof Error ? error.name : 'Error'
    console.error('Error details:', { 
      errorMessage, 
      errorStack, 
      errorName
    })
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: errorMessage,
        name: errorName,
        ...(process.env.NODE_ENV === 'development' && { 
          stack: errorStack
        })
      },
      { status: 500 }
    )
  }
}
