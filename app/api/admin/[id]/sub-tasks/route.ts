import { NextRequest, NextResponse } from 'next/server'
import * as adminRepo from '@/lib/db/repositories/admin'
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
    const subTasks = await adminRepo.getSubTasks(tenantId, taskId)
    return NextResponse.json({ subTasks })
  } catch (error) {
    console.error('Error fetching sub-tasks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
