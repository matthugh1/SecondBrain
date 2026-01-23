import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import { executeQuery } from '@/lib/services/query-engine'
import { saveQueryHistory } from '@/lib/db/repositories/query-history'

export async function POST(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const body = await request.json()
    const query = body.query || body.message || ''

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const result = await executeQuery(tenantId, query.trim())

    // Save to query history (async, don't block)
    saveQueryHistory(tenantId, query.trim(), result.total_results).catch(err => 
      console.error('Error saving query history:', err)
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error executing query:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter q is required' },
        { status: 400 }
      )
    }

    const result = await executeQuery(tenantId, query.trim())

    // Save to query history (async, don't block)
    saveQueryHistory(tenantId, query.trim(), result.total_results).catch(err => 
      console.error('Error saving query history:', err)
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error executing query:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
