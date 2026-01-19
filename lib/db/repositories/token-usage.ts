import { prisma } from '../index'
import { calculateCost } from '@/lib/utils/pricing'

export type TokenUsageProvider = 'openai' | 'anthropic'
export type TokenUsageOperationType = 'classification' | 'digest'

export interface TokenUsageRecord {
  tenantId: string
  provider: TokenUsageProvider
  model: string
  operationType: TokenUsageOperationType
  promptTokens: number
  completionTokens: number
  totalTokens: number
}

export interface TokenUsageStats {
  total: number
  totalCost: number
  byProvider: {
    openai: number
    anthropic: number
  }
  byProviderCost: {
    openai: number
    anthropic: number
  }
  byOperation: {
    classification: number
    digest: number
  }
  byOperationCost: {
    classification: number
    digest: number
  }
  daily: Array<{
    date: string
    tokens: number
    cost: number
  }>
}

export interface TokenUsageQuery {
  startDate?: Date
  endDate?: Date
  provider?: TokenUsageProvider
  operationType?: TokenUsageOperationType
}

/**
 * Create a token usage record (non-blocking)
 */
export async function createTokenUsage(tenantId: string, record: TokenUsageRecord): Promise<void> {
  try {
    await prisma.tokenUsage.create({
      data: {
        tenantId,
        provider: record.provider,
        model: record.model,
        operationType: record.operationType,
        promptTokens: record.promptTokens,
        completionTokens: record.completionTokens,
        totalTokens: record.totalTokens,
      },
    })
    console.log('✅ Token usage recorded:', {
      provider: record.provider,
      operationType: record.operationType,
      totalTokens: record.totalTokens,
    })
  } catch (error: any) {
    // Non-blocking: log error but don't throw
    const errorMessage = error?.message || String(error)
    const errorCode = error?.code
    console.error('❌ Failed to record token usage:', {
      error: errorMessage,
      code: errorCode,
      provider: record.provider,
      operationType: record.operationType,
      tenantId: tenantId.substring(0, 8) + '...', // Log partial tenantId for debugging
    })
  }
}

/**
 * Get aggregated token usage statistics for a tenant
 */
export async function getTokenUsageStats(
  tenantId: string,
  query: TokenUsageQuery = {}
): Promise<TokenUsageStats> {
  const where: any = { tenantId }

  if (query.startDate || query.endDate) {
    where.created = {}
    if (query.startDate) {
      where.created.gte = query.startDate
    }
    if (query.endDate) {
      where.created.lte = query.endDate
    }
  }
  if (query.provider) {
    where.provider = query.provider
  }
  if (query.operationType) {
    where.operationType = query.operationType
  }

  // Get all records for aggregation
  const records = await prisma.tokenUsage.findMany({
    where,
    orderBy: { created: 'asc' },
  })

  // Calculate totals
  const total = records.reduce((sum, r) => sum + r.totalTokens, 0)
  const totalCost = records.reduce(
    (sum, r) => sum + calculateCost(r.model, r.promptTokens, r.completionTokens),
    0
  )

  // Group by provider
  const openaiRecords = records.filter((r) => r.provider === 'openai')
  const anthropicRecords = records.filter((r) => r.provider === 'anthropic')

  const byProvider = {
    openai: openaiRecords.reduce((sum, r) => sum + r.totalTokens, 0),
    anthropic: anthropicRecords.reduce((sum, r) => sum + r.totalTokens, 0),
  }

  const byProviderCost = {
    openai: openaiRecords.reduce(
      (sum, r) => sum + calculateCost(r.model, r.promptTokens, r.completionTokens),
      0
    ),
    anthropic: anthropicRecords.reduce(
      (sum, r) => sum + calculateCost(r.model, r.promptTokens, r.completionTokens),
      0
    ),
  }

  // Group by operation type
  const classificationRecords = records.filter((r) => r.operationType === 'classification')
  const digestRecords = records.filter((r) => r.operationType === 'digest')

  const byOperation = {
    classification: classificationRecords.reduce((sum, r) => sum + r.totalTokens, 0),
    digest: digestRecords.reduce((sum, r) => sum + r.totalTokens, 0),
  }

  const byOperationCost = {
    classification: classificationRecords.reduce(
      (sum, r) => sum + calculateCost(r.model, r.promptTokens, r.completionTokens),
      0
    ),
    digest: digestRecords.reduce(
      (sum, r) => sum + calculateCost(r.model, r.promptTokens, r.completionTokens),
      0
    ),
  }

  // Group by day (with cost)
  const dailyMap = new Map<string, { tokens: number; cost: number }>()
  records.forEach((record) => {
    const date = record.created.toISOString().split('T')[0] // YYYY-MM-DD
    const cost = calculateCost(record.model, record.promptTokens, record.completionTokens)
    const existing = dailyMap.get(date) || { tokens: 0, cost: 0 }
    dailyMap.set(date, {
      tokens: existing.tokens + record.totalTokens,
      cost: existing.cost + cost,
    })
  })

  const daily = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, tokens: data.tokens, cost: data.cost }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    total,
    totalCost,
    byProvider,
    byProviderCost,
    byOperation,
    byOperationCost,
    daily,
  }
}

/**
 * Get token usage breakdown by provider
 */
export async function getTokenUsageByProvider(
  tenantId: string,
  query: TokenUsageQuery = {}
): Promise<{ provider: string; tokens: number }[]> {
  const where: any = { tenantId }

  if (query.startDate || query.endDate) {
    where.created = {}
    if (query.startDate) {
      where.created.gte = query.startDate
    }
    if (query.endDate) {
      where.created.lte = query.endDate
    }
  }
  if (query.operationType) {
    where.operationType = query.operationType
  }

  // Handle case where table doesn't exist yet (migration not run)
  let records
  try {
    records = await prisma.tokenUsage.findMany({
      where,
    })
  } catch (error: any) {
    // If table doesn't exist, return empty array
    const errorMessage = error?.message || String(error)
    if (
      error?.code === 'P2021' ||
      errorMessage.includes('does not exist') ||
      errorMessage.includes('relation') ||
      errorMessage.includes('table')
    ) {
      console.warn('TokenUsage table does not exist yet, returning empty array:', errorMessage)
      return []
    }
    console.error('Error fetching token usage by provider:', error)
    throw error
  }

  const providerMap = new Map<string, number>()
  records.forEach((record) => {
    providerMap.set(record.provider, (providerMap.get(record.provider) || 0) + record.totalTokens)
  })

  return Array.from(providerMap.entries()).map(([provider, tokens]) => ({
    provider,
    tokens,
  }))
}

/**
 * Get token usage breakdown by operation type
 */
export async function getTokenUsageByOperation(
  tenantId: string,
  query: TokenUsageQuery = {}
): Promise<{ operationType: string; tokens: number }[]> {
  const where: any = { tenantId }

  if (query.startDate || query.endDate) {
    where.created = {}
    if (query.startDate) {
      where.created.gte = query.startDate
    }
    if (query.endDate) {
      where.created.lte = query.endDate
    }
  }
  if (query.provider) {
    where.provider = query.provider
  }

  // Handle case where table doesn't exist yet (migration not run)
  let records
  try {
    records = await prisma.tokenUsage.findMany({
      where,
    })
  } catch (error: any) {
    // If table doesn't exist, return empty array
    const errorMessage = error?.message || String(error)
    if (
      error?.code === 'P2021' ||
      errorMessage.includes('does not exist') ||
      errorMessage.includes('relation') ||
      errorMessage.includes('table')
    ) {
      console.warn('TokenUsage table does not exist yet, returning empty array:', errorMessage)
      return []
    }
    console.error('Error fetching token usage by provider:', error)
    throw error
  }

  const operationMap = new Map<string, number>()
  records.forEach((record) => {
    operationMap.set(
      record.operationType,
      (operationMap.get(record.operationType) || 0) + record.totalTokens
    )
  })

  return Array.from(operationMap.entries()).map(([operationType, tokens]) => ({
    operationType,
    tokens,
  }))
}

/**
 * Get recent token usage records
 */
export async function getRecentTokenUsage(
  tenantId: string,
  limit: number = 50,
  query: TokenUsageQuery = {}
): Promise<
  Array<{
    id: number
    provider: string
    model: string
    operationType: string
    promptTokens: number
    completionTokens: number
    totalTokens: number
    created: Date
  }>
> {
  const where: any = { tenantId }

  if (query.startDate || query.endDate) {
    where.created = {}
    if (query.startDate) {
      where.created.gte = query.startDate
    }
    if (query.endDate) {
      where.created.lte = query.endDate
    }
  }
  if (query.provider) {
    where.provider = query.provider
  }
  if (query.operationType) {
    where.operationType = query.operationType
  }

  // Handle case where table doesn't exist yet (migration not run)
  let records
  try {
    records = await prisma.tokenUsage.findMany({
      where,
      orderBy: { created: 'desc' },
      take: limit,
    })
  } catch (error: any) {
    // If table doesn't exist, return empty array
    const errorMessage = error?.message || String(error)
    if (
      error?.code === 'P2021' ||
      errorMessage.includes('does not exist') ||
      errorMessage.includes('relation') ||
      errorMessage.includes('table')
    ) {
      console.warn('TokenUsage table does not exist yet, returning empty array:', errorMessage)
      return []
    }
    console.error('Error fetching recent token usage:', error)
    throw error
  }

  return records.map((r) => ({
    id: r.id,
    provider: r.provider,
    model: r.model,
    operationType: r.operationType,
    promptTokens: r.promptTokens,
    completionTokens: r.completionTokens,
    totalTokens: r.totalTokens,
    created: r.created,
  }))
}
