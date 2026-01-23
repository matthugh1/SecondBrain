import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as templateRepo from '@/lib/db/repositories/action-templates'
import { executeTemplate } from '@/lib/services/action-templates'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const templateId = parseInt(params.id, 10)
    const template = await templateRepo.getActionTemplateById(tenantId, templateId)

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error fetching template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const templateId = parseInt(params.id, 10)
    const body = await request.json()
    const { name, description, actions, parameters } = body

    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (actions !== undefined) updates.actions = actions
    if (parameters !== undefined) updates.parameters = parameters

    await templateRepo.updateActionTemplate(tenantId, templateId, updates)

    const template = await templateRepo.getActionTemplateById(tenantId, templateId)
    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error updating template:', error)
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
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const templateId = parseInt(params.id, 10)
    await templateRepo.deleteActionTemplate(tenantId, templateId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId, userId } = tenantCheck

    const templateId = parseInt(params.id, 10)
    const body = await request.json()
    const { parameters } = body

    const result = await executeTemplate(tenantId, templateId, userId, parameters)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Template execution failed', errors: result.errors },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, actionIds: result.actionIds })
  } catch (error) {
    console.error('Error executing template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
