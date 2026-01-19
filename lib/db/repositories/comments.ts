import { prisma } from '../index'

export interface Comment {
  id?: number
  item_type: string
  item_id: number
  field_key?: string | null
  content: string
  author?: string
  created_at?: string
  updated_at?: string
}

export async function createComment(tenantId: string, comment: Comment): Promise<number> {
  const result = await prisma.comment.create({
    data: {
      tenantId,
      itemType: comment.item_type,
      itemId: comment.item_id,
      fieldKey: comment.field_key || null,
      content: comment.content,
      author: comment.author || 'User',
    },
  })
  return result.id
}

export async function getCommentById(tenantId: string, id: number): Promise<Comment | null> {
  const result = await prisma.comment.findFirst({
    where: {
      id,
      tenantId,
    },
  })
  if (!result) return null
  return {
    id: result.id,
    item_type: result.itemType,
    item_id: result.itemId,
    field_key: result.fieldKey || undefined,
    content: result.content,
    author: result.author,
    created_at: result.createdAt.toISOString(),
    updated_at: result.updatedAt.toISOString(),
  }
}

export async function getCommentsByItem(tenantId: string, itemType: string, itemId: number, fieldKey?: string): Promise<Comment[]> {
  const where: any = {
    tenantId,
    itemType,
    itemId,
  }
  if (fieldKey) {
    where.fieldKey = fieldKey
  }

  const results = await prisma.comment.findMany({
    where,
    orderBy: { createdAt: 'asc' },
  })
  
  return results.map(row => ({
    id: row.id,
    item_type: row.itemType,
    item_id: row.itemId,
    field_key: row.fieldKey || undefined,
    content: row.content,
    author: row.author,
    created_at: row.createdAt.toISOString(),
    updated_at: row.updatedAt.toISOString(),
  }))
}

export async function updateComment(tenantId: string, id: number, updates: Partial<Comment>): Promise<void> {
  const data: any = {
    updatedAt: new Date(),
  }
  
  if (updates.content !== undefined) data.content = updates.content
  if (updates.field_key !== undefined) data.fieldKey = updates.field_key || null
  
  await prisma.comment.updateMany({
    where: {
      id,
      tenantId,
    },
    data,
  })
}

export async function deleteComment(tenantId: string, id: number): Promise<void> {
  await prisma.comment.deleteMany({
    where: {
      id,
      tenantId,
    },
  })
}

export async function deleteCommentsByItem(tenantId: string, itemType: string, itemId: number): Promise<void> {
  await prisma.comment.deleteMany({
    where: {
      tenantId,
      itemType,
      itemId,
    },
  })
}
