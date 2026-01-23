import { NextRequest, NextResponse } from 'next/server'
import * as templateRepo from '@/lib/db/repositories/task-templates'
import * as adminRepo from '@/lib/db/repositories/admin'
import { requireTenant } from '@/lib/auth/utils'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck
  const templateId = parseInt(params.id)

  try {
    const taskId = await adminRepo.createTaskFromTemplate(tenantId, templateId)
    return NextResponse.json({ taskId })
  } catch (error: any) {
    console.error('Error creating task from template:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
