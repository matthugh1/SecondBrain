import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as workflowsRepo from '@/lib/db/repositories/workflows'
import { executeWorkflow } from '@/lib/services/workflows'

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

    const workflowId = parseInt(params.id, 10)
    const workflow = await workflowsRepo.getWorkflowById(tenantId, workflowId)

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ workflow })
  } catch (error) {
    console.error('Error fetching workflow:', error)
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

    const workflowId = parseInt(params.id, 10)
    const body = await request.json()
    const { name, description, trigger, actions, priority, enabled } = body

    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (trigger !== undefined) updates.trigger = trigger
    if (actions !== undefined) updates.actions = actions
    if (priority !== undefined) updates.priority = priority
    if (enabled !== undefined) updates.enabled = enabled

    await workflowsRepo.updateWorkflow(tenantId, workflowId, updates)

    const workflow = await workflowsRepo.getWorkflowById(tenantId, workflowId)
    return NextResponse.json({ workflow })
  } catch (error) {
    console.error('Error updating workflow:', error)
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

    const workflowId = parseInt(params.id, 10)
    await workflowsRepo.deleteWorkflow(tenantId, workflowId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting workflow:', error)
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

    const workflowId = parseInt(params.id, 10)
    const body = await request.json()
    const { triggerData } = body

    const result = await executeWorkflow(tenantId, workflowId, userId, triggerData)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Workflow execution failed', errors: result.errors },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      executedActions: result.executedActions,
    })
  } catch (error) {
    console.error('Error executing workflow:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
