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
    const query = searchParams.get('q') || ''
    const itemTypes = searchParams.get('types')?.split(',') as Category[] | undefined
    const tags = searchParams.get('tags')?.split(',').filter(Boolean)
    const dateFrom = searchParams.get('dateFrom') || undefined
    const dateTo = searchParams.get('dateTo') || undefined
    const status = searchParams.get('status') || undefined
    const archived = searchParams.get('archived') === 'true' ? true : undefined

    const filters = {
      itemTypes,
      tags,
      dateFrom,
      dateTo,
      status,
      archived,
    }

    const results = searchRepo.search(tenantId, query, filters)

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Error searching:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
