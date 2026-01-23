import { NextRequest, NextResponse } from 'next/server'
import * as taskDepsRepo from '@/lib/db/repositories/task-dependencies'
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
  const taskId = parseInt(params.id)

  try {
    const dependencies = await taskDepsRepo.getAllDependencies(tenantId, taskId)
    return NextResponse.json(dependencies)
  } catch (error) {
    console.error('Error fetching dependencies:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
