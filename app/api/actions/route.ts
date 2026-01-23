import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as actionsRepo from '@/lib/db/repositories/actions'
import { executeAction } from '@/lib/services/actions'

export async function GET(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId, userId } = tenantCheck

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as actionsRepo.ActionStatus | undefined
    const actionType = searchParams.get('actionType') as actionsRepo.ActionType | undefined
    const limit = parseInt(searchParams.get('limit') || '100', 10)

    const actions = await actionsRepo.getActionHistory(tenantId, {
      userId,
      status,
      actionType,
      limit,
    })

    return NextResponse.json({ actions })
  } catch (error) {
    console.error('Error fetching actions:', error)
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
    const { tenantId, userId } = tenantCheck

    const body = await request.json()
    const { actionType, targetType, targetId, parameters, requiresApproval, executeImmediately } = body

    if (!actionType) {
      return NextResponse.json(
        { error: 'actionType is required' },
        { status: 400 }
      )
    }

    const actionId = await actionsRepo.createAction(tenantId, {
      userId,
      actionType,
      targetType,
      targetId,
      parameters: parameters || {},
      requiresApproval: requiresApproval ?? true,
    })

    // Execute immediately if requested and doesn't require approval
    if (executeImmediately && (!requiresApproval || requiresApproval === false)) {
      const result = await executeAction(tenantId, actionId, userId)
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Action execution failed' },
          { status: 500 }
        )
      }
    }

    const action = await actionsRepo.getActionById(tenantId, actionId)

    return NextResponse.json({ action })
  } catch (error) {
    console.error('Error creating action:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
