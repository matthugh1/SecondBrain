import { NextRequest, NextResponse } from 'next/server'
import { getAllDigests, getDigestsByType } from '@/lib/db/repositories/digests'
import { requireTenant } from '@/lib/auth/utils'

export async function GET(request: NextRequest) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    let digests
    if (type === 'daily' || type === 'weekly') {
      digests = await getDigestsByType(tenantId, type)
    } else {
      digests = await getAllDigests(tenantId)
    }

    return NextResponse.json(digests)
  } catch (error) {
    console.error('Error fetching digests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
