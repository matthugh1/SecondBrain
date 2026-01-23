import { prisma } from '../index'
import type { Admin, AdminStatus, TaskPriority, TaskStatus } from '@/types'

export async function createAdmin(tenantId: string, admin: Admin): Promise<number> {
  const data: any = {
    tenantId,
    name: admin.name,
    dueDate: admin.due_date || null,
    status: admin.status || 'Todo',
    priority: admin.priority || 'medium',
    notes: admin.notes || null,
    completedAt: admin.completedAt ? new Date(admin.completedAt) : null,
    estimatedDuration: admin.estimatedDuration || null,
    actualDuration: admin.actualDuration || null,
    recurrenceRule: admin.recurrenceRule || null,
    parentTaskId: admin.parentTaskId || null,
    projectId: admin.projectId || null,
    assigneeId: admin.assigneeId || null,
    created: admin.created ? new Date(admin.created) : new Date(),
  }
  
  // Only include startDate if it's provided
  if (admin.startDate !== undefined) {
    data.startDate = admin.startDate ? new Date(admin.startDate) : null
  }
  
  const result = await prisma.admin.create({ data })
  return result.id
}

export async function getAdminById(tenantId: string, id: number): Promise<Admin | null> {
  const result = await prisma.admin.findFirst({
    where: {
      id,
      tenantId,
    },
    include: {
      subTasks: true,
      project: true,
    },
  })
  if (!result) return null
  return {
    id: result.id,
    name: result.name,
    due_date: result.dueDate || undefined,
    startDate: result.startDate?.toISOString(),
    status: result.status as TaskStatus,
    priority: result.priority as TaskPriority | undefined,
    notes: result.notes || undefined,
    completedAt: result.completedAt?.toISOString(),
    estimatedDuration: result.estimatedDuration || undefined,
    actualDuration: result.actualDuration || undefined,
    recurrenceRule: result.recurrenceRule || undefined,
    parentTaskId: result.parentTaskId || undefined,
    projectId: result.projectId || undefined,
    assigneeId: result.assigneeId || undefined,
    created: result.created.toISOString(),
  }
}

export async function getAllAdmin(tenantId: string, includeArchived: boolean = false): Promise<Admin[]> {
  const results = await prisma.admin.findMany({
    where: {
      tenantId,
      ...(includeArchived ? {} : { archived: 0 }),
    },
    orderBy: { created: 'desc' },
  })
  return results.map(mapToAdmin)
}

export async function getAdminByStatus(tenantId: string, status: AdminStatus): Promise<Admin[]> {
  const results = await prisma.admin.findMany({
    where: {
      tenantId,
      status,
    },
    orderBy: { created: 'desc' },
  })
  return results.map(mapToAdmin)
}

export async function getAdminTasksDueOnDate(tenantId: string, date: string): Promise<Admin[]> {
  const results = await prisma.admin.findMany({
    where: {
      tenantId,
      dueDate: date,
      archived: 0,
    },
    orderBy: { created: 'desc' },
  })
  return results.map(mapToAdmin)
}

export async function archiveAdmin(tenantId: string, id: number): Promise<void> {
  await prisma.admin.updateMany({
    where: {
      id,
      tenantId,
    },
    data: {
      archived: 1,
      archivedAt: new Date(),
      updatedAt: new Date(),
    },
  })
}

export async function unarchiveAdmin(tenantId: string, id: number): Promise<void> {
  await prisma.admin.updateMany({
    where: {
      id,
      tenantId,
    },
    data: {
      archived: 0,
      archivedAt: null,
      updatedAt: new Date(),
    },
  })
}

export async function updateAdmin(tenantId: string, id: number, updates: Partial<Admin>): Promise<void> {
  const data: any = {
    updatedAt: new Date(),
  }
  
  if (updates.name !== undefined) data.name = updates.name
  if (updates.due_date !== undefined) data.dueDate = updates.due_date || null
  if (updates.startDate !== undefined) data.startDate = updates.startDate ? new Date(updates.startDate) : null
  if (updates.status !== undefined) {
    data.status = updates.status
    // Auto-set completedAt when status changes to Done
    if (updates.status === 'Done' && !updates.completedAt) {
      data.completedAt = new Date()
    } else if (updates.status !== 'Done') {
      data.completedAt = null
    }
  }
  if (updates.priority !== undefined) data.priority = updates.priority
  if (updates.notes !== undefined) data.notes = updates.notes || null
  if (updates.completedAt !== undefined) data.completedAt = updates.completedAt ? new Date(updates.completedAt) : null
  if (updates.estimatedDuration !== undefined) data.estimatedDuration = updates.estimatedDuration || null
  if (updates.actualDuration !== undefined) data.actualDuration = updates.actualDuration || null
  if (updates.recurrenceRule !== undefined) data.recurrenceRule = updates.recurrenceRule || null
  if (updates.parentTaskId !== undefined) data.parentTaskId = updates.parentTaskId || null
  if (updates.projectId !== undefined) data.projectId = updates.projectId || null
  if (updates.assigneeId !== undefined) data.assigneeId = updates.assigneeId || null
  
  await prisma.admin.updateMany({
    where: {
      id,
      tenantId,
    },
    data,
  })
}

export async function updateTaskStatus(
  tenantId: string,
  id: number,
  status: TaskStatus,
  completedAt?: Date
): Promise<void> {
  try {
    // First verify the task exists
    const existingTask = await prisma.admin.findFirst({
      where: {
        id,
        tenantId,
      },
    })
    
    if (!existingTask) {
      throw new Error(`Task with id ${id} not found or does not belong to tenant ${tenantId}`)
    }
    
    const data: any = {
      status,
      updatedAt: new Date(),
    }
    
    if (status === 'Done') {
      data.completedAt = completedAt || new Date()
    } else {
      // Only clear completedAt if status is changing from Done to something else
      if (existingTask.status === 'Done') {
        data.completedAt = null
      }
    }
    
    await prisma.admin.updateMany({
      where: {
        id,
        tenantId,
      },
      data,
    })
    
    // Check if this is a sub-task and update parent if needed
    if (existingTask.parentTaskId) {
      await updateParentTaskStatus(tenantId, existingTask.parentTaskId)
    }
  } catch (error: any) {
    console.error(`Error in updateTaskStatus for task ${id}:`, error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    })
    throw error
  }
}

async function updateParentTaskStatus(tenantId: string, parentTaskId: number): Promise<void> {
  const subTasks = await prisma.admin.findMany({
    where: {
      tenantId,
      parentTaskId,
      archived: 0,
    },
  })
  
  if (subTasks.length === 0) return
  
  const allDone = subTasks.every(t => t.status === 'Done')
  const anyInProgress = subTasks.some(t => t.status === 'In Progress')
  const anyBlocked = subTasks.some(t => t.status === 'Blocked')
  
  let newStatus: TaskStatus = 'Todo'
  if (allDone) {
    newStatus = 'Done'
  } else if (anyBlocked) {
    newStatus = 'Blocked'
  } else if (anyInProgress) {
    newStatus = 'In Progress'
  }
  
  await prisma.admin.updateMany({
    where: {
      id: parentTaskId,
      tenantId,
    },
    data: {
      status: newStatus,
      updatedAt: new Date(),
    },
  })
}

export async function deleteAdmin(tenantId: string, id: number): Promise<void> {
  await prisma.admin.deleteMany({
    where: {
      id,
      tenantId,
    },
  })
}

export async function getTasksByPriority(tenantId: string, priority: TaskPriority): Promise<Admin[]> {
  const results = await prisma.admin.findMany({
    where: {
      tenantId,
      priority,
      archived: 0,
    },
    orderBy: { dueDate: 'asc' },
  })
  return results.map(mapToAdmin)
}

export async function getTasksByStatus(tenantId: string, status: TaskStatus): Promise<Admin[]> {
  const results = await prisma.admin.findMany({
    where: {
      tenantId,
      status,
      archived: 0,
    },
    orderBy: { dueDate: 'asc' },
  })
  return results.map(mapToAdmin)
}

export async function getTasksByProject(tenantId: string, projectId: number): Promise<Admin[]> {
  const results = await prisma.admin.findMany({
    where: {
      tenantId,
      projectId,
      archived: 0,
    },
    orderBy: { dueDate: 'asc' },
  })
  return results.map(mapToAdmin)
}

export async function getSubTasks(tenantId: string, parentTaskId: number): Promise<Admin[]> {
  const results = await prisma.admin.findMany({
    where: {
      tenantId,
      parentTaskId,
      archived: 0,
    },
    orderBy: { created: 'asc' },
  })
  return results.map(mapToAdmin)
}

export async function getRecurringTasks(tenantId: string): Promise<Admin[]> {
  const results = await prisma.admin.findMany({
    where: {
      tenantId,
      recurrenceRule: { not: null },
      archived: 0,
    },
    orderBy: { dueDate: 'asc' },
  })
  return results.map(mapToAdmin)
}

export async function getOverdueTasks(tenantId: string): Promise<Admin[]> {
  const today = new Date().toISOString().split('T')[0]
  const results = await prisma.admin.findMany({
    where: {
      tenantId,
      archived: 0,
      status: { not: 'Done' },
      dueDate: { lt: today },
    },
    orderBy: { dueDate: 'asc' },
  })
  return results.map(mapToAdmin)
}

export async function getTasksDueInRange(
  tenantId: string,
  startDate: string,
  endDate: string
): Promise<Admin[]> {
  const results = await prisma.admin.findMany({
    where: {
      tenantId,
      archived: 0,
      dueDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { dueDate: 'asc' },
  })
  return results.map(mapToAdmin)
}

export async function createTaskFromTemplate(
  tenantId: string,
  templateId: number,
  overrides?: Partial<Admin>
): Promise<number> {
  const template = await prisma.taskTemplate.findFirst({
    where: {
      id: templateId,
      tenantId,
    },
  })
  
  if (!template) {
    throw new Error('Template not found')
  }
  
  const defaultValues = template.defaultValues ? JSON.parse(template.defaultValues) : {}
  const fields = JSON.parse(template.fields)
  
  const taskData: Partial<Admin> = {
    name: overrides?.name || defaultValues.name || 'Untitled Task',
    status: (overrides?.status || defaultValues.status || 'Todo') as TaskStatus,
    priority: (overrides?.priority || defaultValues.priority || 'medium') as TaskPriority,
    notes: overrides?.notes || defaultValues.notes,
    due_date: overrides?.due_date || defaultValues.due_date,
    projectId: overrides?.projectId || defaultValues.projectId,
    ...overrides,
  }
  
  return createAdmin(tenantId, taskData as Admin)
}

function mapToAdmin(result: any): Admin {
  return {
    id: result.id,
    name: result.name,
    due_date: result.dueDate || undefined,
    startDate: result.startDate?.toISOString(),
    status: result.status as TaskStatus,
    priority: result.priority as TaskPriority | undefined,
    notes: result.notes || undefined,
    completedAt: result.completedAt?.toISOString(),
    estimatedDuration: result.estimatedDuration || undefined,
    actualDuration: result.actualDuration || undefined,
    recurrenceRule: result.recurrenceRule || undefined,
    parentTaskId: result.parentTaskId || undefined,
    projectId: result.projectId || undefined,
    assigneeId: result.assigneeId || undefined,
    created: result.created.toISOString(),
  }
}
