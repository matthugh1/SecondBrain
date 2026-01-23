import { NextRequest, NextResponse } from 'next/server'
import * as taskDepsRepo from '@/lib/db/repositories/task-dependencies'
import { requireTenant } from '@/lib/auth/utils'

export async function POST(request: NextRequest) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const body = await request.json()
    const { taskId, dependsOnTaskId, dependencyType = 'blocks' } = body

    if (!taskId || !dependsOnTaskId) {
      return NextResponse.json(
        { error: 'taskId and dependsOnTaskId are required' },
        { status: 400 }
      )
    }

    const id = await taskDepsRepo.createDependency(
      tenantId,
      taskId,
      dependsOnTaskId,
      dependencyType
    )

    return NextResponse.json({ id }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating dependency:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const body = await request.json()
    const { taskId, dependsOnTaskId } = body

    if (!taskId || !dependsOnTaskId) {
      return NextResponse.json(
        { error: 'taskId and dependsOnTaskId are required' },
        { status: 400 }
      )
    }

    await taskDepsRepo.deleteDependency(tenantId, taskId, dependsOnTaskId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting dependency:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
