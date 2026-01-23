import { NextRequest, NextResponse } from 'next/server'
import { fixClassification } from '@/lib/services/fix'
import { requireTenant } from '@/lib/auth/utils'
import type { Category } from '@/types'

export async function POST(request: NextRequest) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId, userId } = tenantCheck

  try {
    const body = await request.json()
    const { logId, category } = body

    if (!logId || typeof logId !== 'number') {
      return NextResponse.json(
        { error: 'logId is required and must be a number' },
        { status: 400 }
      )
    }

    if (!category || !['people', 'projects', 'ideas', 'admin'].includes(category)) {
      return NextResponse.json(
        { error: 'Valid category is required (people, projects, ideas, or admin)' },
        { status: 400 }
      )
    }

    const result = await fixClassification(tenantId, logId, category as Category, userId)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in fix API:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}
