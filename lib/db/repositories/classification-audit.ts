import { prisma } from '../index'

export type ClassificationAuditStatus = 'success' | 'error'

export interface ClassificationAuditLog {
  message_text: string
  provider: string
  model?: string
  prompt?: string
  response_text?: string
  parsed_result?: Record<string, any>
  status: ClassificationAuditStatus
  error_message?: string
  created?: string
}

export interface ClassificationAuditRow {
  id: number
  message_text: string
  provider: string
  model: string | null
  prompt: string | null
  response_text: string | null
  parsed_result: string | null
  status: ClassificationAuditStatus
  error_message: string | null
  created: string
}

export interface ClassificationAuditQuery {
  status?: ClassificationAuditStatus
  provider?: string
  limit?: number
  offset?: number
}

export async function createClassificationAudit(tenantId: string, log: ClassificationAuditLog): Promise<number> {
  const result = await prisma.classificationAudit.create({
    data: {
      tenantId,
      messageText: log.message_text,
      provider: log.provider,
      model: log.model || null,
      prompt: log.prompt || null,
      responseText: log.response_text || null,
      parsedResult: log.parsed_result ? JSON.stringify(log.parsed_result) : null,
      status: log.status,
      errorMessage: log.error_message || null,
      created: log.created ? new Date(log.created) : new Date(),
    },
  })
  return result.id
}

export async function getClassificationAuditLogs(tenantId: string, query: ClassificationAuditQuery = {}): Promise<ClassificationAuditRow[]> {
  const where: any = { tenantId }
  
  if (query.status) {
    where.status = query.status
  }
  if (query.provider) {
    where.provider = query.provider
  }
  
  const results = await prisma.classificationAudit.findMany({
    where,
    orderBy: { created: 'desc' },
    take: query.limit ?? 100,
    skip: query.offset ?? 0,
  })
  
  return results.map(row => ({
    id: row.id,
    message_text: row.messageText,
    provider: row.provider,
    model: row.model,
    prompt: row.prompt,
    response_text: row.responseText,
    parsed_result: row.parsedResult,
    status: row.status as ClassificationAuditStatus,
    error_message: row.errorMessage,
    created: row.created.toISOString(),
  }))
}

export async function getClassificationAuditCount(tenantId: string, query: ClassificationAuditQuery = {}): Promise<number> {
  const where: any = { tenantId }
  
  if (query.status) {
    where.status = query.status
  }
  if (query.provider) {
    where.provider = query.provider
  }
  
  return await prisma.classificationAudit.count({ where })
}
