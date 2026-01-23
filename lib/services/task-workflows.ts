import * as adminRepo from '@/lib/db/repositories/admin'
import * as taskDepsRepo from '@/lib/db/repositories/task-dependencies'
import type { Admin, TaskStatus } from '@/types'

export interface TaskWorkflowRule {
  id?: string
  name: string
  condition: {
    field: string
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains'
    value: any
  }
  action: {
    type: 'update_status' | 'update_priority' | 'create_task' | 'send_notification'
    value: any
  }
  enabled: boolean
}

/**
 * Check if a task matches a workflow condition
 */
function matchesCondition(task: Admin, condition: TaskWorkflowRule['condition']): boolean {
  const taskValue = (task as any)[condition.field]

  switch (condition.operator) {
    case 'equals':
      return taskValue === condition.value
    case 'not_equals':
      return taskValue !== condition.value
    case 'greater_than':
      return taskValue > condition.value
    case 'less_than':
      return taskValue < condition.value
    case 'contains':
      return String(taskValue).toLowerCase().includes(String(condition.value).toLowerCase())
    default:
      return false
  }
}

/**
 * Execute a workflow action
 */
async function executeAction(
  tenantId: string,
  task: Admin,
  action: TaskWorkflowRule['action']
): Promise<void> {
  switch (action.type) {
    case 'update_status':
      await adminRepo.updateTaskStatus(tenantId, task.id!, action.value as TaskStatus)
      break
    case 'update_priority':
      await adminRepo.updateAdmin(tenantId, task.id!, { priority: action.value })
      break
    case 'create_task':
      const newTask: Admin = {
        name: action.value.name || 'Follow-up task',
        status: 'Todo',
        priority: action.value.priority || 'medium',
        projectId: task.projectId,
      }
      await adminRepo.createAdmin(tenantId, newTask)
      break
    case 'send_notification':
      // Notification logic would go here
      console.log(`Notification: ${action.value.message}`)
      break
  }
}

/**
 * Process a task against workflow rules
 */
export async function processTaskWorkflows(
  tenantId: string,
  taskId: number,
  rules: TaskWorkflowRule[]
): Promise<void> {
  const task = await adminRepo.getAdminById(tenantId, taskId)
  if (!task) return

  for (const rule of rules) {
    if (!rule.enabled) continue

    if (matchesCondition(task, rule.condition)) {
      await executeAction(tenantId, task, rule.action)
    }
  }
}

/**
 * Auto-update task status based on dependencies
 */
export async function autoUpdateTaskStatusFromDependencies(
  tenantId: string,
  taskId: number
): Promise<void> {
  await taskDepsRepo.autoUpdateStatusWhenDependenciesComplete(tenantId, taskId)
}

/**
 * Auto-update parent task when all sub-tasks complete
 */
export async function autoUpdateParentTaskStatus(
  tenantId: string,
  taskId: number
): Promise<void> {
  const task = await adminRepo.getAdminById(tenantId, taskId)
  if (!task || !task.parentTaskId) return

  const subTasks = await adminRepo.getSubTasks(tenantId, task.parentTaskId)
  const allDone = subTasks.every(t => t.status === 'Done')
  const anyInProgress = subTasks.some(t => t.status === 'In Progress')
  const anyBlocked = subTasks.some(t => t.status === 'Blocked')

  if (allDone) {
    await adminRepo.updateTaskStatus(tenantId, task.parentTaskId, 'Done')
  } else if (anyBlocked) {
    await adminRepo.updateTaskStatus(tenantId, task.parentTaskId, 'Blocked')
  } else if (anyInProgress) {
    await adminRepo.updateTaskStatus(tenantId, task.parentTaskId, 'In Progress')
  }
}

/**
 * Auto-escalate overdue tasks
 */
export async function autoEscalateOverdueTasks(tenantId: string): Promise<void> {
  const overdueTasks = await adminRepo.getOverdueTasks(tenantId)
  
  for (const task of overdueTasks) {
    if (task.priority !== 'urgent' && task.status !== 'Done') {
      await adminRepo.updateAdmin(tenantId, task.id!, { priority: 'urgent' })
    }
  }
}
