import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as templatesRepo from '@/lib/db/repositories/digest-templates'

export async function PATCH(
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
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { name, prompt } = body

    if (!name && !prompt) {
      return NextResponse.json(
        { error: 'At least one field (name or prompt) is required' },
        { status: 400 }
      )
    }

    await templatesRepo.updateTemplate(tenantId, id, {
      ...(name && { name }),
      ...(prompt && { prompt }),
    })

    const updatedTemplate = await templatesRepo.getTemplateById(tenantId, id)
    return NextResponse.json(updatedTemplate)
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
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const id = parseInt(params.id)
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid template ID' },
        { status: 400 }
      )
    }

    await templatesRepo.deleteTemplate(tenantId, id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
