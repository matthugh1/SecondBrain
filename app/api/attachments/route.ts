import { NextRequest, NextResponse } from 'next/server'
import { getAttachmentsByItem } from '@/lib/db/repositories/attachments'
import { requireTenant } from '@/lib/auth/utils'

export async function GET(request: NextRequest) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const { searchParams } = new URL(request.url)
    const itemType = searchParams.get('itemType')
    const itemId = searchParams.get('itemId')

    if (!itemType || !itemId) {
      return NextResponse.json(
        { error: 'itemType and itemId required' },
        { status: 400 }
      )
    }

    const attachments = await getAttachmentsByItem(tenantId, itemType, parseInt(itemId))
    return NextResponse.json(attachments)
  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
