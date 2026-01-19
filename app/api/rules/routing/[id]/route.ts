import { NextRequest, NextResponse } from 'next/server'
import {
  getAllRuleRouting,
  updateRuleRouting,
  deleteRuleRouting,
} from '@/lib/db/repositories/rules'
import { requireTenant } from '@/lib/auth/utils'

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
    const id = parseInt(params.id)
    await updateRuleRouting(tenantId, id, body)
    const routing = await getAllRuleRouting(tenantId)
    const updated = routing.find(r => r.id === id)
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating rule routing:', error)
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
    const id = parseInt(params.id)
    await deleteRuleRouting(tenantId, id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting rule routing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
