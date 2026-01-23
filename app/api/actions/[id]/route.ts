import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as actionsRepo from '@/lib/db/repositories/actions'
import { executeAction, rollbackAction } from '@/lib/services/actions'

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

    const actionId = parseInt(params.id, 10)
    const action = await actionsRepo.getActionById(tenantId, actionId)

    if (!action) {
      return NextResponse.json(
        { error: 'Action not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ action })
  } catch (error) {
    console.error('Error fetching action:', error)
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
    const { tenantId, userId } = tenantCheck

    const actionId = parseInt(params.id, 10)
    const body = await request.json()
    const { approve, reject, reason, execute } = body

    const action = await actionsRepo.getActionById(tenantId, actionId)
    if (!action) {
      return NextResponse.json(
        { error: 'Action not found' },
        { status: 404 }
      )
    }

    if (approve) {
      await actionsRepo.approveAction(tenantId, actionId, userId!)
      
      // Execute immediately after approval
      if (execute !== false) {
        const result = await executeAction(tenantId, actionId, userId)
        if (!result.success) {
          return NextResponse.json(
            { error: result.error || 'Action execution failed' },
            { status: 500 }
          )
        }
      }

      const updatedAction = await actionsRepo.getActionById(tenantId, actionId)
      return NextResponse.json({ action: updatedAction })
    }

    if (reject) {
      await actionsRepo.rejectAction(tenantId, actionId, reason)
      const updatedAction = await actionsRepo.getActionById(tenantId, actionId)
      return NextResponse.json({ action: updatedAction })
    }

    return NextResponse.json(
      { error: 'Must specify approve or reject' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating action:', error)
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

    const actionId = parseInt(params.id, 10)
    const body = await request.json()
    const { execute, rollback } = body

    if (execute) {
      const result = await executeAction(tenantId, actionId, userId)
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Action execution failed' },
          { status: 500 }
        )
      }
      const action = await actionsRepo.getActionById(tenantId, actionId)
      return NextResponse.json({ action, result: result.result })
    }

    if (rollback) {
      const result = await rollbackAction(tenantId, actionId)
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Rollback failed' },
          { status: 500 }
        )
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Must specify execute or rollback' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error executing action:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
