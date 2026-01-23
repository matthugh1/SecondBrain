import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import { syncItemToNotion, createNotionPageFromCapture } from '@/lib/services/notion-integration'

export async function POST(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const body = await request.json()
    const { itemType, itemId, notionDatabaseId, captureText, captureCategory } = body

    if (captureText && captureCategory) {
      // Create page from capture
      const result = await createNotionPageFromCapture(
        tenantId,
        captureText,
        captureCategory,
        notionDatabaseId
      )

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to create Notion page' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, pageId: result.pageId })
    }

    if (itemType && itemId) {
      // Sync item to Notion
      const result = await syncItemToNotion(tenantId, itemType, itemId, notionDatabaseId)

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to sync to Notion' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true, pageId: result.pageId })
    }

    return NextResponse.json(
      { error: 'Must provide either (itemType and itemId) or (captureText and captureCategory)' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Error syncing to Notion:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
