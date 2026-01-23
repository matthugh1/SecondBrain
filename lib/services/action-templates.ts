import * as templateRepo from '@/lib/db/repositories/action-templates'
import * as actionsRepo from '@/lib/db/repositories/actions'
import { executeAction } from './actions'

/**
 * Execute an action template
 */
export async function executeTemplate(
  tenantId: string,
  templateId: number,
  userId?: string,
  parameters?: Record<string, any>
): Promise<{ success: boolean; actionIds: number[]; errors?: string[] }> {
  const template = await templateRepo.getActionTemplateById(tenantId, templateId)
  if (!template) {
    return { success: false, actionIds: [], errors: ['Template not found'] }
  }

  const actionIds: number[] = []
  const errors: string[] = []

  // Execute each action in sequence
  for (const actionDef of template.actions) {
    try {
      // Replace template parameters with provided values
      const resolvedParameters = resolveParameters(actionDef.parameters, parameters || {})

      const actionId = await actionsRepo.createAction(tenantId, {
        userId,
        actionType: actionDef.actionType as actionsRepo.ActionType,
        targetType: actionDef.targetType as any,
        parameters: resolvedParameters,
        requiresApproval: false, // Templates execute without approval
      })

      actionIds.push(actionId)

      // Execute immediately
      const result = await executeAction(tenantId, actionId, userId)
      if (!result.success) {
        errors.push(`Action ${actionDef.actionType} failed: ${result.error}`)
      }
    } catch (error: any) {
      errors.push(`Error executing ${actionDef.actionType}: ${error.message}`)
    }
  }

  return {
    success: errors.length === 0,
    actionIds,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * Resolve template parameters with provided values
 */
function resolveParameters(
  templateParams: Record<string, any>,
  providedParams: Record<string, any>
): Record<string, any> {
  const resolved: Record<string, any> = {}

  for (const [key, value] of Object.entries(templateParams)) {
    if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
      // Template variable: {{paramName}}
      const paramName = value.slice(2, -2).trim()
      resolved[key] = providedParams[paramName] ?? value
    } else {
      resolved[key] = value
    }
  }

  return resolved
}
