import * as plansRepo from '@/lib/db/repositories/plans'
import * as actionsRepo from '@/lib/db/repositories/actions'
import { executeAction } from './actions'

/**
 * Execute a plan step by step
 */
export async function executePlan(
  tenantId: string,
  planId: number,
  userId: string
): Promise<{ success: boolean; executedSteps: number; errors?: string[] }> {
  const plan = await plansRepo.getPlanById(tenantId, planId)
  if (!plan) {
    return { success: false, executedSteps: 0, errors: ['Plan not found'] }
  }

  // Update plan status to executing
  await plansRepo.updatePlanStatus(tenantId, planId, 'executing', undefined, new Date())

  const errors: string[] = []
  let executedCount = 0

  // Build dependency graph
  const stepMap = new Map(plan.steps.map(s => [s.stepOrder, s]))
  const completedSteps = new Set<number>()

  // Execute steps in order, respecting dependencies
  for (const step of plan.steps) {
    // Check if dependencies are completed
    if (step.dependencies && step.dependencies.length > 0) {
      const allDependenciesCompleted = step.dependencies.every(dep => completedSteps.has(dep))
      if (!allDependenciesCompleted) {
        // Skip this step for now, will retry later
        continue
      }
    }

    // Execute step
    try {
      await plansRepo.updateStepStatus(tenantId, planId, step.stepOrder, 'executing')

      const actionId = await actionsRepo.createAction(tenantId, {
        userId,
        actionType: step.actionType as actionsRepo.ActionType,
        targetType: step.actionParams.targetType,
        targetId: step.actionParams.targetId,
        parameters: step.actionParams,
        requiresApproval: false,
      })

      const result = await executeAction(tenantId, actionId, userId)
      
      if (result.success) {
        await plansRepo.updateStepStatus(
          tenantId,
          planId,
          step.stepOrder,
          'completed',
          result.result
        )
        completedSteps.add(step.stepOrder)
        executedCount++
      } else {
        await plansRepo.updateStepStatus(
          tenantId,
          planId,
          step.stepOrder,
          'failed',
          undefined,
          result.error
        )
        errors.push(`Step ${step.stepOrder} failed: ${result.error}`)
      }
    } catch (error: any) {
      await plansRepo.updateStepStatus(
        tenantId,
        planId,
        step.stepOrder,
        'failed',
        undefined,
        error.message
      )
      errors.push(`Step ${step.stepOrder} error: ${error.message}`)
    }
  }

  // Update plan status
  if (errors.length === 0 && executedCount === plan.steps.length) {
    await plansRepo.updatePlanStatus(tenantId, planId, 'completed', undefined, undefined, new Date())
  } else if (errors.length > 0) {
    await plansRepo.updatePlanStatus(tenantId, planId, 'failed')
  }

  return {
    success: errors.length === 0,
    executedSteps: executedCount,
    errors: errors.length > 0 ? errors : undefined,
  }
}
