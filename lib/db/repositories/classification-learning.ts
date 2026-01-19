import { prisma } from '../index'
import type { Category } from '@/types'

export interface ClassificationCorrection {
  id: number
  inbox_log_id: number
  original_category: string
  corrected_category: string
  message_text: string
  created_at: string
}

export interface ClassificationCorrectionInput {
  inbox_log_id: number
  original_category: string
  corrected_category: string
  message_text: string
}

export async function createCorrection(
  tenantId: string,
  correction: ClassificationCorrectionInput
): Promise<number> {
  const result = await prisma.classificationCorrection.create({
    data: {
      tenantId,
      inboxLogId: correction.inbox_log_id,
      originalCategory: correction.original_category,
      correctedCategory: correction.corrected_category,
      messageText: correction.message_text,
    },
  })
  return result.id
}

export async function getRecentCorrections(
  tenantId: string,
  limit: number = 5,
  daysBack: number = 30
): Promise<ClassificationCorrection[]> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysBack)

  const results = await prisma.classificationCorrection.findMany({
    where: {
      tenantId,
      createdAt: {
        gte: cutoffDate,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  })

  return results.map(row => ({
    id: row.id,
    inbox_log_id: row.inboxLogId,
    original_category: row.originalCategory,
    corrected_category: row.correctedCategory,
    message_text: row.messageText,
    created_at: row.createdAt.toISOString(),
  }))
}

export async function getCorrectionsByCategory(
  tenantId: string,
  category: Category,
  limit: number = 5
): Promise<ClassificationCorrection[]> {
  const results = await prisma.classificationCorrection.findMany({
    where: {
      tenantId,
      correctedCategory: category,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  })

  return results.map(row => ({
    id: row.id,
    inbox_log_id: row.inboxLogId,
    original_category: row.originalCategory,
    corrected_category: row.correctedCategory,
    message_text: row.messageText,
    created_at: row.createdAt.toISOString(),
  }))
}

export async function getCorrectionCount(tenantId: string): Promise<number> {
  return await prisma.classificationCorrection.count({
    where: { tenantId },
  })
}

export async function getAllCorrections(
  tenantId: string,
  limit: number = 50,
  offset: number = 0,
  daysBack: number = 365
): Promise<ClassificationCorrection[]> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysBack)

  const results = await prisma.classificationCorrection.findMany({
    where: {
      tenantId,
      createdAt: {
        gte: cutoffDate,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
  })

  return results.map(row => ({
    id: row.id,
    inbox_log_id: row.inboxLogId,
    original_category: row.originalCategory,
    corrected_category: row.correctedCategory,
    message_text: row.messageText,
    created_at: row.createdAt.toISOString(),
  }))
}
