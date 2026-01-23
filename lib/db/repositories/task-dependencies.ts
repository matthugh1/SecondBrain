import { prisma } from '../index'
import type { TaskDependency, TaskDependencyType } from '@/types'

export async function createDependency(
  tenantId: string,
  taskId: number,
  dependsOnTaskId: number,
  dependencyType: TaskDependencyType = 'blocks'
): Promise<number> {
  // Check for circular dependencies
  await checkCircularDependency(tenantId, taskId, dependsOnTaskId)
  
  const result = await prisma.taskDependency.create({
    data: {
      tenantId,
      taskId,
      dependsOnTaskId,
      dependencyType,
    },
  })
  return result.id
}

export async function getBlockingTasks(tenantId: string, taskId: number): Promise<TaskDependency[]> {
  const results = await prisma.taskDependency.findMany({
    where: {
      tenantId,
      taskId,
      dependencyType: 'blocks',
    },
    include: {
      dependsOnTask: true,
    },
  })
  return results.map(dep => ({
    id: dep.id,
    taskId: dep.taskId,
    dependsOnTaskId: dep.dependsOnTaskId,
    dependencyType: dep.dependencyType as TaskDependencyType,
  }))
}

export async function getBlockedTasks(tenantId: string, taskId: number): Promise<TaskDependency[]> {
  const results = await prisma.taskDependency.findMany({
    where: {
      tenantId,
      dependsOnTaskId: taskId,
      dependencyType: 'blocks',
    },
    include: {
      task: true,
    },
  })
  return results.map(dep => ({
    id: dep.id,
    taskId: dep.taskId,
    dependsOnTaskId: dep.dependsOnTaskId,
    dependencyType: dep.dependencyType as TaskDependencyType,
  }))
}

export async function getAllDependencies(tenantId: string, taskId: number): Promise<{
  blocking: TaskDependency[]
  blockedBy: TaskDependency[]
}> {
  const [blocking, blockedBy] = await Promise.all([
    getBlockingTasks(tenantId, taskId),
    getBlockedTasks(tenantId, taskId),
  ])
  return { blocking, blockedBy }
}

export async function deleteDependency(
  tenantId: string,
  taskId: number,
  dependsOnTaskId: number
): Promise<void> {
  await prisma.taskDependency.deleteMany({
    where: {
      tenantId,
      taskId,
      dependsOnTaskId,
    },
  })
}

export async function checkCircularDependency(
  tenantId: string,
  taskId: number,
  dependsOnTaskId: number
): Promise<void> {
  // If taskId depends on dependsOnTaskId, check if dependsOnTaskId (directly or indirectly) depends on taskId
  const visited = new Set<number>()
  const toVisit = [dependsOnTaskId]
  
  while (toVisit.length > 0) {
    const currentTaskId = toVisit.shift()!
    
    if (currentTaskId === taskId) {
      throw new Error('Circular dependency detected')
    }
    
    if (visited.has(currentTaskId)) {
      continue
    }
    
    visited.add(currentTaskId)
    
    // Get all tasks that currentTaskId depends on
    const dependencies = await prisma.taskDependency.findMany({
      where: {
        tenantId,
        taskId: currentTaskId,
        dependencyType: 'blocks',
      },
      select: {
        dependsOnTaskId: true,
      },
    })
    
    for (const dep of dependencies) {
      toVisit.push(dep.dependsOnTaskId)
    }
  }
}

export async function checkDependenciesComplete(tenantId: string, taskId: number): Promise<boolean> {
  const blockingTasks = await getBlockingTasks(tenantId, taskId)
  
  if (blockingTasks.length === 0) {
    return true
  }
  
  const blockingTaskIds = blockingTasks.map(dep => dep.dependsOnTaskId)
  const blockingTasksData = await prisma.admin.findMany({
    where: {
      tenantId,
      id: { in: blockingTaskIds },
    },
    select: {
      id: true,
      status: true,
    },
  })
  
  return blockingTasksData.every(task => task.status === 'Done')
}

export async function autoUpdateStatusWhenDependenciesComplete(
  tenantId: string,
  taskId: number
): Promise<void> {
  const allDependenciesComplete = await checkDependenciesComplete(tenantId, taskId)
  
  if (allDependenciesComplete) {
    const task = await prisma.admin.findFirst({
      where: {
        id: taskId,
        tenantId,
      },
      select: {
        status: true,
      },
    })
    
    // Only auto-update if task is currently blocked or waiting
    if (task && (task.status === 'Blocked' || task.status === 'Waiting')) {
      await prisma.admin.updateMany({
        where: {
          id: taskId,
          tenantId,
        },
        data: {
          status: 'Todo',
          updatedAt: new Date(),
        },
      })
    }
  }
}
