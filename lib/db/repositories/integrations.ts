import { prisma } from '../index'

export type IntegrationProvider = 'gmail' | 'slack' | 'notion' | 'google_calendar' | 'outlook'
export type IntegrationStatus = 'active' | 'error' | 'disconnected'

export interface Integration {
  id: number
  tenantId: string
  provider: IntegrationProvider
  config: Record<string, any>
  status: IntegrationStatus
  lastSync?: Date
  lastError?: string
  errorCount: number
  createdAt: Date
  updatedAt: Date
}

/**
 * Create or update integration
 */
export async function upsertIntegration(
  tenantId: string,
  provider: IntegrationProvider,
  config: Record<string, any>,
  status: IntegrationStatus = 'active'
): Promise<number> {
  const result = await prisma.integration.upsert({
    where: {
      tenantId_provider: {
        tenantId,
        provider,
      },
    },
    create: {
      tenantId,
      provider,
      config: JSON.stringify(config),
      status,
    },
    update: {
      config: JSON.stringify(config),
      status,
      updatedAt: new Date(),
    },
  })
  return result.id
}

/**
 * Get integration by provider
 */
export async function getIntegrationByProvider(
  tenantId: string,
  provider: IntegrationProvider
): Promise<Integration | null> {
  const integration = await prisma.integration.findUnique({
    where: {
      tenantId_provider: {
        tenantId,
        provider,
      },
    },
  })

  if (!integration) return null

  return {
    id: integration.id,
    tenantId: integration.tenantId,
    provider: integration.provider as IntegrationProvider,
    config: JSON.parse(integration.config),
    status: integration.status as IntegrationStatus,
    lastSync: integration.lastSync || undefined,
    lastError: integration.lastError || undefined,
    errorCount: integration.errorCount,
    createdAt: integration.createdAt,
    updatedAt: integration.updatedAt,
  }
}

/**
 * Get all integrations for a tenant
 */
export async function getAllIntegrations(
  tenantId: string,
  status?: IntegrationStatus
): Promise<Integration[]> {
  const integrations = await prisma.integration.findMany({
    where: {
      tenantId,
      ...(status ? { status } : {}),
    },
    orderBy: { createdAt: 'desc' },
  })

  return integrations.map(integration => ({
    id: integration.id,
    tenantId: integration.tenantId,
    provider: integration.provider as IntegrationProvider,
    config: JSON.parse(integration.config),
    status: integration.status as IntegrationStatus,
    lastSync: integration.lastSync || undefined,
    lastError: integration.lastError || undefined,
    errorCount: integration.errorCount,
    createdAt: integration.createdAt,
    updatedAt: integration.updatedAt,
  }))
}

/**
 * Update integration status
 */
export async function updateIntegrationStatus(
  tenantId: string,
  provider: IntegrationProvider,
  status: IntegrationStatus,
  lastError?: string
): Promise<void> {
  const data: any = {
    status,
    updatedAt: new Date(),
  }

  if (lastError) {
    data.lastError = lastError
    data.errorCount = { increment: 1 }
  } else {
    data.errorCount = 0
  }

  await prisma.integration.updateMany({
    where: {
      tenantId,
      provider,
    },
    data,
  })
}

/**
 * Update last sync time
 */
export async function updateLastSync(
  tenantId: string,
  provider: IntegrationProvider
): Promise<void> {
  await prisma.integration.updateMany({
    where: {
      tenantId,
      provider,
    },
    data: {
      lastSync: new Date(),
      updatedAt: new Date(),
    },
  })
}

/**
 * Delete integration
 */
export async function deleteIntegration(
  tenantId: string,
  provider: IntegrationProvider
): Promise<void> {
  await prisma.integration.deleteMany({
    where: {
      tenantId,
      provider,
    },
  })
}
