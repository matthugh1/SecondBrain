import { NextRequest, NextResponse } from 'next/server'
import * as templateRepo from '@/lib/db/repositories/task-templates'
import { requireTenant } from '@/lib/auth/utils'
import type { TaskTemplate } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck
  const id = parseInt(params.id)

  try {
    const template = await templateRepo.getTaskTemplateById(tenantId, id)
    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(template)
  } catch (error) {
    console.error('Error fetching task template:', error)
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
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck
  const id = parseInt(params.id)

  try {
    const body = await request.json()
    await templateRepo.updateTaskTemplate(tenantId, id, body as Partial<TaskTemplate>)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating task template:', error)
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
  const id = parseInt(params.id)

  try {
    await templateRepo.deleteTaskTemplate(tenantId, id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting task template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
