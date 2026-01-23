import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as agentActivityRepo from '@/lib/db/repositories/agent-activity'
import * as actionsRepo from '@/lib/db/repositories/actions'
import { executeAction } from '@/lib/services/actions'

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

    const activityId = parseInt(params.id, 10)
    const body = await request.json()
    const { approve, reject, feedback } = body

    if (approve) {
      await agentActivityRepo.updateActivityStatus(
        tenantId,
        userId!,
        activityId,
        'approved',
        feedback || 'positive'
      )

      // Get activity to execute action
      const activities = await agentActivityRepo.getAgentActivities(tenantId, userId!, { limit: 1000 })
      const activity = activities.find(a => a.id === activityId)

      if (activity && activity.actionType && activity.targetType && activity.targetId) {
        // Create and execute action
        const actionId = await actionsRepo.createAction(tenantId, {
          userId,
          actionType: activity.actionType as any,
          targetType: activity.targetType,
          targetId: activity.targetId,
          parameters: {},
          requiresApproval: false,
        })

        await executeAction(tenantId, actionId, userId).catch(err =>
          console.error('Error executing action:', err)
        )

        await agentActivityRepo.updateActivityStatus(
          tenantId,
          userId!,
          activityId,
          'executed'
        )
      }

      return NextResponse.json({ success: true })
    }

    if (reject) {
      await agentActivityRepo.updateActivityStatus(
        tenantId,
        userId!,
        activityId,
        'rejected',
        feedback || 'negative'
      )

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Must specify approve or reject' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating activity:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
