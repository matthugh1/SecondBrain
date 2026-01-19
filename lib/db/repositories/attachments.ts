import { prisma } from '../index'

export interface Attachment {
  id?: number
  item_type: string
  item_id: number
  filename: string
  filepath: string
  mime_type?: string | null
  size?: number | null
  uploaded_at?: string
}

export async function createAttachment(tenantId: string, attachment: Attachment): Promise<number> {
  const result = await prisma.attachment.create({
    data: {
      tenantId,
      itemType: attachment.item_type,
      itemId: attachment.item_id,
      filename: attachment.filename,
      filepath: attachment.filepath,
      mimeType: attachment.mime_type || null,
      size: attachment.size || null,
    },
  })
  return result.id
}

export async function getAttachmentById(tenantId: string, id: number): Promise<Attachment | null> {
  const result = await prisma.attachment.findFirst({
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
    filename: result.filename,
    filepath: result.filepath,
    mime_type: result.mimeType || undefined,
    size: result.size || undefined,
    uploaded_at: result.uploadedAt.toISOString(),
  }
}

export async function getAttachmentsByItem(tenantId: string, itemType: string, itemId: number): Promise<Attachment[]> {
  const results = await prisma.attachment.findMany({
    where: {
      tenantId,
      itemType,
      itemId,
    },
    orderBy: { uploadedAt: 'desc' },
  })
  
  return results.map(row => ({
    id: row.id,
    item_type: row.itemType,
    item_id: row.itemId,
    filename: row.filename,
    filepath: row.filepath,
    mime_type: row.mimeType || undefined,
    size: row.size || undefined,
    uploaded_at: row.uploadedAt.toISOString(),
  }))
}

export async function deleteAttachment(tenantId: string, id: number): Promise<void> {
  await prisma.attachment.deleteMany({
    where: {
      id,
      tenantId,
    },
  })
}

export async function deleteAttachmentsByItem(tenantId: string, itemType: string, itemId: number): Promise<void> {
  await prisma.attachment.deleteMany({
    where: {
      tenantId,
      itemType,
      itemId,
    },
  })
}
