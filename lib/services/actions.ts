import * as actionsRepo from '@/lib/db/repositories/actions'
import * as peopleRepo from '@/lib/db/repositories/people'
import * as projectsRepo from '@/lib/db/repositories/projects'
import * as ideasRepo from '@/lib/db/repositories/ideas'
import * as adminRepo from '@/lib/db/repositories/admin'
import * as relationshipsRepo from '@/lib/db/repositories/relationships'
import * as remindersRepo from '@/lib/db/repositories/reminders'
import type { Category } from '@/types'

/**
 * Execute an action
 */
export async function executeAction(
  tenantId: string,
  actionId: number,
  userId?: string
): Promise<{ success: boolean; result?: any; error?: string }> {
  const action = await actionsRepo.getActionById(tenantId, actionId)
  if (!action) {
    return { success: false, error: 'Action not found' }
  }

  // Check if action requires approval
  if (action.requiresApproval && action.status !== 'approved') {
    return { success: false, error: 'Action requires approval' }
  }

  // Update status to executing
  await actionsRepo.updateActionStatus(tenantId, actionId, 'executing')

  try {
    // Store rollback data before execution
    const rollbackData = await getCurrentState(tenantId, action)
    await actionsRepo.storeRollbackData(tenantId, actionId, rollbackData)

    // Execute based on action type
    let result: any

    switch (action.actionType) {
      case 'create':
        result = await executeCreate(tenantId, action, userId)
        break
      case 'update':
        result = await executeUpdate(tenantId, action, userId)
        break
      case 'delete':
        result = await executeDelete(tenantId, action, userId)
        break
      case 'link':
        result = await executeLink(tenantId, action, userId)
        break
      case 'notify':
        result = await executeNotify(tenantId, action, userId)
        break
      case 'schedule':
        result = await executeSchedule(tenantId, action, userId)
        break
      default:
        throw new Error(`Unknown action type: ${action.actionType}`)
    }

    // Mark as executed
    await actionsRepo.updateActionStatus(tenantId, actionId, 'executed', result)

    return { success: true, result }
  } catch (error: any) {
    // Mark as failed
    await actionsRepo.updateActionStatus(
      tenantId,
      actionId,
      'failed',
      undefined,
      error.message || 'Unknown error'
    )
    return { success: false, error: error.message || 'Unknown error' }
  }
}

/**
 * Get current state for rollback
 */
async function getCurrentState(
  tenantId: string,
  action: actionsRepo.AgentAction
): Promise<Record<string, any>> {
  if (!action.targetType || !action.targetId) {
    return {}
  }

  switch (action.targetType) {
    case 'people': {
      const person = await peopleRepo.getPersonById(tenantId, action.targetId)
      return person ? { person } : {}
    }
    case 'projects': {
      const project = await projectsRepo.getProjectById(tenantId, action.targetId)
      return project ? { project } : {}
    }
    case 'ideas': {
      const idea = await ideasRepo.getIdeaById(tenantId, action.targetId)
      return idea ? { idea } : {}
    }
    case 'admin': {
      const task = await adminRepo.getAdminById(tenantId, action.targetId)
      return task ? { task } : {}
    }
    default:
      return {}
  }
}

/**
 * Execute create action
 */
async function executeCreate(
  tenantId: string,
  action: actionsRepo.AgentAction,
  userId?: string
): Promise<any> {
  const { targetType, parameters } = action

  switch (targetType) {
    case 'people': {
      const id = await peopleRepo.createPerson(tenantId, parameters as any)
      return { id, type: 'people' }
    }
    case 'projects': {
      const id = await projectsRepo.createProject(tenantId, parameters as any)
      return { id, type: 'projects' }
    }
    case 'ideas': {
      const id = await ideasRepo.createIdea(tenantId, parameters as any)
      return { id, type: 'ideas' }
    }
    case 'admin': {
      const id = await adminRepo.createAdmin(tenantId, parameters as any)
      return { id, type: 'admin' }
    }
    default:
      throw new Error(`Cannot create item of type: ${targetType}`)
  }
}

/**
 * Execute update action
 */
async function executeUpdate(
  tenantId: string,
  action: actionsRepo.AgentAction,
  userId?: string
): Promise<any> {
  const { targetType, targetId, parameters } = action

  if (!targetId) {
    throw new Error('targetId is required for update action')
  }

  switch (targetType) {
    case 'people':
      await peopleRepo.updatePerson(tenantId, targetId, parameters)
      break
    case 'projects':
      await projectsRepo.updateProject(tenantId, targetId, parameters)
      break
    case 'ideas':
      await ideasRepo.updateIdea(tenantId, targetId, parameters)
      break
    case 'admin':
      await adminRepo.updateAdmin(tenantId, targetId, parameters)
      break
    default:
      throw new Error(`Cannot update item of type: ${targetType}`)
  }

  return { success: true }
}

/**
 * Execute delete action
 */
async function executeDelete(
  tenantId: string,
  action: actionsRepo.AgentAction,
  userId?: string
): Promise<any> {
  const { targetType, targetId } = action

  if (!targetId) {
    throw new Error('targetId is required for delete action')
  }

  switch (targetType) {
    case 'people':
      await peopleRepo.deletePerson(tenantId, targetId)
      break
    case 'projects':
      await projectsRepo.deleteProject(tenantId, targetId)
      break
    case 'ideas':
      await ideasRepo.deleteIdea(tenantId, targetId)
      break
    case 'admin':
      await adminRepo.deleteAdmin(tenantId, targetId)
      break
    default:
      throw new Error(`Cannot delete item of type: ${targetType}`)
  }

  return { success: true }
}

/**
 * Execute link action
 */
async function executeLink(
  tenantId: string,
  action: actionsRepo.AgentAction,
  userId?: string
): Promise<any> {
  const { parameters } = action
  const { sourceType, sourceId, targetType, targetId, relationshipType, strength } = parameters

  if (!sourceType || !sourceId || !targetType || !targetId) {
    throw new Error('sourceType, sourceId, targetType, and targetId are required for link action')
  }

  await relationshipsRepo.upsertRelationship(
    tenantId,
    sourceType,
    sourceId,
    targetType,
    targetId,
    relationshipType || 'mentioned_in',
    strength || 0.5
  )

  return { success: true }
}

/**
 * Execute notify action
 */
async function executeNotify(
  tenantId: string,
  action: actionsRepo.AgentAction,
  userId?: string
): Promise<any> {
  const { parameters } = action
  const { title, message, priority } = parameters

  // For now, create a reminder as notification
  // In production, this would send actual notifications
  if (userId) {
    await remindersRepo.createReminder(
      tenantId,
      userId,
      'notification',
      'admin',
      0, // No specific item
      title || 'Notification',
      message || '',
      undefined,
      priority || 'medium'
    )
  }

  return { success: true }
}

/**
 * Execute schedule action
 */
async function executeSchedule(
  tenantId: string,
  action: actionsRepo.AgentAction,
  userId?: string
): Promise<any> {
  const { parameters } = action
  const { reminderType, itemType, itemId, title, message, dueDate, priority } = parameters

  if (!userId) {
    throw new Error('userId is required for schedule action')
  }

  await remindersRepo.createReminder(
    tenantId,
    userId,
    reminderType || 'due_date',
    itemType || 'admin',
    itemId || 0,
    title || 'Reminder',
    message || '',
    dueDate ? new Date(dueDate) : undefined,
    priority || 'medium'
  )

  return { success: true }
}

/**
 * Rollback an action
 */
export async function rollbackAction(
  tenantId: string,
  actionId: number
): Promise<{ success: boolean; error?: string }> {
  const action = await actionsRepo.getActionById(tenantId, actionId)
  if (!action) {
    return { success: false, error: 'Action not found' }
  }

  if (action.status !== 'executed') {
    return { success: false, error: 'Can only rollback executed actions' }
  }

  if (!action.rollbackData) {
    return { success: false, error: 'No rollback data available' }
  }

  try {
    // Create a rollback action
    const rollbackActionId = await actionsRepo.createAction(tenantId, {
      actionType: 'update',
      targetType: action.targetType,
      targetId: action.targetId,
      parameters: action.rollbackData,
      requiresApproval: false,
    })

    // Execute rollback immediately
    const result = await executeAction(tenantId, rollbackActionId)

    if (result.success) {
      // Mark original action as rolled back
      await actionsRepo.updateActionStatus(tenantId, actionId, 'executed', {
        rolledBack: true,
        rollbackActionId,
      })
    }

    return result
  } catch (error: any) {
    return { success: false, error: error.message || 'Rollback failed' }
  }
}
