import * as workflowsRepo from '@/lib/db/repositories/workflows'
import * as actionsRepo from '@/lib/db/repositories/actions'
import { executeAction } from './actions'
import { prisma } from '@/lib/db'
import type { Category } from '@/types'

/**
 * Evaluate if a workflow trigger matches
 */
export function evaluateTrigger(
  trigger: workflowsRepo.WorkflowTrigger,
  event: {
    type: string
    itemType?: Category
    itemId?: number
    item?: any
  }
): boolean {
  // Check trigger type matches
  if (trigger.type === 'item_created' && event.type !== 'item_created') return false
  if (trigger.type === 'item_updated' && event.type !== 'item_updated') return false
  if (trigger.type === 'item_deleted' && event.type !== 'item_deleted') return false
  if (trigger.type === 'status_changed' && event.type !== 'status_changed') return false
  if (trigger.type === 'scheduled' && event.type !== 'scheduled') return false

  // Check item type matches
  if (trigger.itemType && trigger.itemType !== event.itemType) return false

  // Evaluate conditions
  if (trigger.conditions && event.item) {
    for (const condition of trigger.conditions) {
      const fieldValue = getFieldValue(event.item, condition.field)
      if (!evaluateCondition(fieldValue, condition.operator, condition.value)) {
        return false
      }
    }
  }

  return true
}

/**
 * Get field value from object (supports nested fields)
 */
function getFieldValue(obj: any, field: string): any {
  const parts = field.split('.')
  let value = obj
  for (const part of parts) {
    if (value === null || value === undefined) return undefined
    value = value[part]
  }
  return value
}

/**
 * Evaluate a single condition
 */
function evaluateCondition(fieldValue: any, operator: string, expectedValue: any): boolean {
  switch (operator) {
    case 'equals':
      return fieldValue === expectedValue
    case 'not_equals':
      return fieldValue !== expectedValue
    case 'contains':
      return String(fieldValue).includes(String(expectedValue))
    case 'not_contains':
      return !String(fieldValue).includes(String(expectedValue))
    case 'greater_than':
      return Number(fieldValue) > Number(expectedValue)
    case 'less_than':
      return Number(fieldValue) < Number(expectedValue)
    case 'greater_or_equal':
      return Number(fieldValue) >= Number(expectedValue)
    case 'less_or_equal':
      return Number(fieldValue) <= Number(expectedValue)
    case 'is_empty':
      return fieldValue === null || fieldValue === undefined || fieldValue === ''
    case 'is_not_empty':
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== ''
    default:
      return false
  }
}

/**
 * Generate idempotency key for workflow execution
 */
function generateIdempotencyKey(workflowId: number, triggerData?: Record<string, any>): string {
  const crypto = require('crypto')
  const triggerHash = triggerData 
    ? crypto.createHash('sha256').update(JSON.stringify(triggerData)).digest('hex').substring(0, 16)
    : 'default'
  return `wf_${workflowId}_${triggerHash}`
}

/**
 * Execute workflow actions
 */
export async function executeWorkflow(
  tenantId: string,
  workflowId: number,
  userId?: string,
  triggerData?: Record<string, any>
): Promise<{ success: boolean; executedActions: number; errors?: string[] }> {
  const workflow = await workflowsRepo.getWorkflowById(tenantId, workflowId)
  if (!workflow || !workflow.enabled) {
    return { success: false, executedActions: 0, errors: ['Workflow not found or disabled'] }
  }

  // IDEMPOTENCY: Check for existing execution with same idempotency key
  const idempotencyKey = generateIdempotencyKey(workflowId, triggerData)
  const { prisma } = await import('@/lib/db')
  const existingExecution = await prisma.workflowExecution.findFirst({
    where: {
      idempotencyKey,
      tenantId,
      workflowId,
      // Only consider executions within last hour as duplicates
      executedAt: {
        gte: new Date(Date.now() - 60 * 60 * 1000),
      },
    },
    orderBy: { executedAt: 'desc' },
  })

  if (existingExecution) {
    console.log(`✅ Workflow ${workflowId} already executed with same trigger data - returning existing result`)
    const executedActions = existingExecution.executedActions 
      ? JSON.parse(existingExecution.executedActions) 
      : []
    return {
      success: existingExecution.status === 'success',
      executedActions: Array.isArray(executedActions) ? executedActions.length : 0,
      errors: existingExecution.errorMessage ? [existingExecution.errorMessage] : undefined,
    }
  }

  const errors: string[] = []
  let executedCount = 0

  // Execute each action within a transaction
  await prisma.$transaction(async (tx) => {
    for (const actionDef of workflow.actions) {
      try {
        // Resolve parameters with trigger data
        const resolvedParameters = resolveActionParameters(actionDef.parameters, triggerData || {})

        const actionId = await actionsRepo.createAction(tenantId, {
          userId,
          actionType: actionDef.actionType as actionsRepo.ActionType,
          targetType: actionDef.targetType as Category | undefined,
          parameters: resolvedParameters,
          requiresApproval: false, // Workflow actions execute automatically
        })

        const result = await executeAction(tenantId, actionId, userId)
        if (result.success) {
          executedCount++
        } else {
          errors.push(`Action ${actionDef.actionType} failed: ${result.error}`)
        }
      } catch (error: any) {
        errors.push(`Error executing ${actionDef.actionType}: ${error.message}`)
      }
    }

    // Record execution within transaction
    await tx.workflowExecution.create({
      data: {
        tenantId,
        workflowId,
        status: errors.length === 0 ? 'success' : 'failed',
        triggerData: triggerData ? JSON.stringify(triggerData) : null,
        executedActions: workflow.actions ? JSON.stringify(workflow.actions) : null,
        errorMessage: errors.length > 0 ? errors.join('; ') : null,
        idempotencyKey,
      },
    })
  })

  return {
    success: errors.length === 0,
    executedActions: executedCount,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * Resolve action parameters with trigger data
 */
function resolveActionParameters(
  templateParams: Record<string, any>,
  triggerData: Record<string, any>
): Record<string, any> {
  const resolved: Record<string, any> = {}

  for (const [key, value] of Object.entries(templateParams)) {
    if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
      // Template variable: {{field}}
      const fieldPath = value.slice(2, -2).trim()
      resolved[key] = getFieldValue(triggerData, fieldPath) ?? value
    } else {
      resolved[key] = value
    }
  }

  return resolved
}

/**
 * Process event and check workflows
 */
export async function processEvent(
  tenantId: string,
  event: {
    type: string
    itemType?: Category
    itemId?: number
    item?: any
    userId?: string
  }
): Promise<void> {
  // Get all enabled workflows
  const workflows = await workflowsRepo.getAllWorkflows(tenantId, true)

  // Check each workflow
  for (const workflow of workflows) {
    if (evaluateTrigger(workflow.trigger, event)) {
      // Execute workflow asynchronously (don't block)
      executeWorkflow(tenantId, workflow.id, event.userId, {
        ...event,
        item: event.item,
      }).catch(err => {
        console.error(`Error executing workflow ${workflow.id}:`, err)
      })
    }
  }
}
