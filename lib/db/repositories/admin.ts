import { prisma } from '../index'
import type { Admin, AdminStatus } from '@/types'

export async function createAdmin(tenantId: string, admin: Admin): Promise<number> {
  const result = await prisma.admin.create({
    data: {
      tenantId,
      name: admin.name,
      dueDate: admin.due_date || null,
      status: admin.status || 'Todo',
      notes: admin.notes || null,
      created: admin.created ? new Date(admin.created) : new Date(),
    },
  })
  return result.id
}

export async function getAdminById(tenantId: string, id: number): Promise<Admin | null> {
  const result = await prisma.admin.findFirst({
    where: {
      id,
      tenantId,
    },
  })
  if (!result) return null
  return {
    id: result.id,
    name: result.name,
    due_date: result.dueDate || undefined,
    status: result.status as AdminStatus,
    notes: result.notes || undefined,
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
  return results.map(result => ({
    id: result.id,
    name: result.name,
    due_date: result.dueDate || undefined,
    status: result.status as AdminStatus,
    notes: result.notes || undefined,
    created: result.created.toISOString(),
  }))
}

export async function getAdminByStatus(tenantId: string, status: AdminStatus): Promise<Admin[]> {
  const results = await prisma.admin.findMany({
    where: {
      tenantId,
      status,
    },
    orderBy: { created: 'desc' },
  })
  return results.map(result => ({
    id: result.id,
    name: result.name,
    due_date: result.dueDate || undefined,
    status: result.status as AdminStatus,
    notes: result.notes || undefined,
    created: result.created.toISOString(),
  }))
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
  return results.map(result => ({
    id: result.id,
    name: result.name,
    due_date: result.dueDate || undefined,
    status: result.status as AdminStatus,
    notes: result.notes || undefined,
    created: result.created.toISOString(),
  }))
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
  if (updates.status !== undefined) data.status = updates.status
  if (updates.notes !== undefined) data.notes = updates.notes || null
  
  await prisma.admin.updateMany({
    where: {
      id,
      tenantId,
    },
    data,
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
