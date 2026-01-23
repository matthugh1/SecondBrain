import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as actionsRepo from '@/lib/db/repositories/actions'
import { executeAction } from '@/lib/services/actions'
import { validateRequest } from '@/lib/middleware/validate-request'
import { handleError } from '@/lib/middleware/error-handler'
import { createActionSchema } from '@/lib/validation/schemas'

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
    return handleError(error, '/api/actions')
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId, userId } = tenantCheck

    // Validate request body
    const validation = await validateRequest(createActionSchema, request)
    if (!validation.success) {
      return validation.response
    }

    const { data } = validation
    const { actionType, targetType, targetId, parameters, requiresApproval, executeImmediately } = data

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
    return handleError(error, '/api/actions')
  }
}
