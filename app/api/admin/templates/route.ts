import { NextRequest, NextResponse } from 'next/server'
import * as templateRepo from '@/lib/db/repositories/task-templates'
import { requireTenant } from '@/lib/auth/utils'
import type { TaskTemplate } from '@/types'

export async function GET(request: NextRequest) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const templates = await templateRepo.getAllTaskTemplates(tenantId)
    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching task templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const body = await request.json()
    const id = await templateRepo.createTaskTemplate(tenantId, body as TaskTemplate)
    return NextResponse.json({ id, ...body }, { status: 201 })
  } catch (error) {
    console.error('Error creating task template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
