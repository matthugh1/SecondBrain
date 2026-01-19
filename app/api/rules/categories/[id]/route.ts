import { NextRequest, NextResponse } from 'next/server'
import {
  getRuleCategoryByKey,
  updateRuleCategory,
  deleteRuleCategory,
} from '@/lib/db/repositories/rules'
import { requireTenant } from '@/lib/auth/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const category = await getRuleCategoryByKey(tenantId, params.id)
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(category)
  } catch (error) {
    console.error('Error fetching rule category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const body = await request.json()
    const category = await getRuleCategoryByKey(tenantId, params.id)
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }
    await updateRuleCategory(tenantId, category.id, body)
    const updated = await getRuleCategoryByKey(tenantId, params.id)
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating rule category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const category = await getRuleCategoryByKey(tenantId, params.id)
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }
    await deleteRuleCategory(tenantId, category.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting rule category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
