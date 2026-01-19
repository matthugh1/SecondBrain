import { NextRequest, NextResponse } from 'next/server'
import {
  getAllRulePrompts,
  updateRulePrompt,
  deleteRulePrompt,
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
    console.log('📥 API received update request:', { id, tenantId, bodyKeys: Object.keys(body), hasTemplate: 'template' in body, templateLength: body.template?.length })
    await updateRulePrompt(tenantId, id, body)
    const prompts = await getAllRulePrompts(tenantId)
    const updated = prompts.find(p => p.id === id)
    console.log('📤 API returning updated prompt:', { id, hasTemplate: !!updated?.template, templateLength: updated?.template?.length })
    return NextResponse.json(updated)
  } catch (error) {
    console.error('❌ Error updating rule prompt:', error)
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
    await deleteRulePrompt(tenantId, id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting rule prompt:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
