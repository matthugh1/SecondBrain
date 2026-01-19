import { NextRequest, NextResponse } from 'next/server'
import * as searchRepo from '@/lib/db/repositories/search'
import type { Category } from '@/types'
import { requireTenant } from '@/lib/auth/utils'

export async function GET(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const searchParams = request.nextUrl.searchParams
    const itemTypes = searchParams.get('types')?.split(',') as Category[] | undefined
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)
    const dateFrom = searchParams.get('dateFrom') || undefined
    const dateTo = searchParams.get('dateTo') || undefined

    const filters = {
      itemTypes,
      tags,
      dateFrom,
      dateTo,
    }

    const results = searchRepo.getTimeline(tenantId, filters)

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Error fetching timeline:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
