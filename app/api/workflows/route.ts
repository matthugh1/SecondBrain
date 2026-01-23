import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as workflowsRepo from '@/lib/db/repositories/workflows'

export async function GET(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const searchParams = request.nextUrl.searchParams
    const enabledOnly = searchParams.get('enabled') === 'true'

    const workflows = await workflowsRepo.getAllWorkflows(tenantId, enabledOnly)

    return NextResponse.json({ workflows })
  } catch (error) {
    console.error('Error fetching workflows:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const body = await request.json()
    const { name, description, trigger, actions, priority, enabled } = body

    if (!name || !trigger || !actions || !Array.isArray(actions)) {
      return NextResponse.json(
        { error: 'name, trigger, and actions array are required' },
        { status: 400 }
      )
    }

    const workflowId = await workflowsRepo.createWorkflow(tenantId, {
      name,
      description,
      trigger,
      actions,
      priority: priority || 0,
      enabled: enabled ?? true,
    })

    const workflow = await workflowsRepo.getWorkflowById(tenantId, workflowId)

    return NextResponse.json({ workflow })
  } catch (error) {
    console.error('Error creating workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
