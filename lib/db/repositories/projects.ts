import { prisma } from '../index'
import type { Project, ProjectStatus } from '@/types'
import { auditCreate, auditUpdate, auditDelete } from '@/lib/middleware/audit-log'

export async function createProject(tenantId: string, project: Project): Promise<number> {
  const result = await prisma.project.create({
    data: {
      tenantId,
      name: project.name,
      status: project.status || 'Active',
      nextAction: project.next_action || null,
      notes: project.notes || null,
    },
  })
  
  // Audit log the creation
  await auditCreate(tenantId, 'projects', result.id, project)
  
  return result.id
}

export async function getProjectById(tenantId: string, id: number): Promise<Project | null> {
  const result = await prisma.project.findFirst({
    where: {
      id,
      tenantId,
    },
  })
  if (!result) return null
  return {
    id: result.id,
    name: result.name,
    status: result.status as ProjectStatus,
    next_action: result.nextAction || undefined,
    notes: result.notes || undefined,
  }
}

export async function getProjectByName(tenantId: string, name: string): Promise<Project | null> {
  const result = await prisma.project.findFirst({
    where: {
      name,
      tenantId,
    },
  })
  if (!result) return null
  return {
    id: result.id,
    name: result.name,
    status: result.status as ProjectStatus,
    next_action: result.nextAction || undefined,
    notes: result.notes || undefined,
  }
}

export async function getAllProjects(tenantId: string, includeArchived: boolean = false): Promise<Project[]> {
  const results = await prisma.project.findMany({
    where: {
      tenantId,
      ...(includeArchived ? {} : { archived: 0 }),
    },
    orderBy: { createdAt: 'desc' },
  })
  return results.map(result => ({
    id: result.id,
    name: result.name,
    status: result.status as ProjectStatus,
    next_action: result.nextAction || undefined,
    notes: result.notes || undefined,
  }))
}

export async function getActiveProjects(tenantId: string): Promise<Project[]> {
  const results = await prisma.project.findMany({
    where: {
      tenantId,
      status: { in: ['Active', 'Waiting', 'Blocked'] },
      archived: 0,
    },
    orderBy: { createdAt: 'desc' },
  })
  return results.map(result => ({
    id: result.id,
    name: result.name,
    status: result.status as ProjectStatus,
    next_action: result.nextAction || undefined,
    notes: result.notes || undefined,
  }))
}

export async function archiveProject(tenantId: string, id: number): Promise<void> {
  await prisma.project.updateMany({
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

export async function unarchiveProject(tenantId: string, id: number): Promise<void> {
  await prisma.project.updateMany({
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

export async function updateProject(tenantId: string, id: number, updates: Partial<Project>): Promise<void> {
  // Get old data for audit log
  const oldProject = await getProjectById(tenantId, id)
  
  const data: any = {
    updatedAt: new Date(),
  }
  
  if (updates.name !== undefined) data.name = updates.name
  if (updates.status !== undefined) data.status = updates.status
  if (updates.next_action !== undefined) data.nextAction = updates.next_action || null
  if (updates.notes !== undefined) data.notes = updates.notes || null
  
  await prisma.project.updateMany({
    where: {
      id,
      tenantId,
    },
    data,
  })
  
  // Audit log the update
  if (oldProject) {
    const newProject = await getProjectById(tenantId, id)
    if (newProject) {
      await auditUpdate(tenantId, 'projects', id, oldProject, newProject)
    }
  }
}

export async function deleteProject(tenantId: string, id: number): Promise<void> {
  // Get old data for audit log
  const oldProject = await getProjectById(tenantId, id)
  
  await prisma.project.deleteMany({
    where: {
      id,
      tenantId,
    },
  })
  
  // Audit log the deletion
  if (oldProject) {
    await auditDelete(tenantId, 'projects', id, oldProject)
  }
}
