import { prisma } from '../index'
import { hashServiceAccountToken } from '@/lib/auth/service-account'

export interface ServiceAccount {
  id: number
  tenantId: string
  name: string
  description?: string
  lastUsedAt?: Date
  expiresAt?: Date
  revokedAt?: Date
  createdBy?: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateServiceAccountInput {
  tenantId: string
  name: string
  description?: string
  expiresAt?: Date
  createdBy?: string
}

export interface ServiceAccountWithToken extends ServiceAccount {
  token: string // Only returned on creation, never stored
}

/**
 * Create a new service account and return it with the token
 * The token is only shown once - it must be saved immediately
 */
export async function createServiceAccount(
  input: CreateServiceAccountInput
): Promise<ServiceAccountWithToken> {
  // Generate token (only shown once)
  const { generateServiceAccountToken } = await import('@/lib/auth/service-account')
  const token = generateServiceAccountToken()
  const tokenHash = hashServiceAccountToken(token)

  const serviceAccount = await prisma.serviceAccount.create({
    data: {
      tenantId: input.tenantId,
      name: input.name,
      description: input.description,
      tokenHash,
      expiresAt: input.expiresAt,
      createdBy: input.createdBy,
    },
  })

  return {
    id: serviceAccount.id,
    tenantId: serviceAccount.tenantId,
    name: serviceAccount.name,
    description: serviceAccount.description || undefined,
    lastUsedAt: serviceAccount.lastUsedAt || undefined,
    expiresAt: serviceAccount.expiresAt || undefined,
    revokedAt: serviceAccount.revokedAt || undefined,
    createdBy: serviceAccount.createdBy || undefined,
    createdAt: serviceAccount.createdAt,
    updatedAt: serviceAccount.updatedAt,
    token, // Only returned on creation
  }
}

/**
 * Get all service accounts for a tenant
 */
export async function getServiceAccounts(
  tenantId: string
): Promise<ServiceAccount[]> {
  const accounts = await prisma.serviceAccount.findMany({
    where: {
      tenantId,
      revokedAt: null, // Only return active accounts
    },
    orderBy: { createdAt: 'desc' },
  })

  return accounts.map(account => ({
    id: account.id,
    tenantId: account.tenantId,
    name: account.name,
    description: account.description || undefined,
    lastUsedAt: account.lastUsedAt || undefined,
    expiresAt: account.expiresAt || undefined,
    revokedAt: account.revokedAt || undefined,
    createdBy: account.createdBy || undefined,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  }))
}

/**
 * Get service account by ID (for tenant)
 */
export async function getServiceAccountById(
  tenantId: string,
  id: number
): Promise<ServiceAccount | null> {
  const account = await prisma.serviceAccount.findFirst({
    where: {
      id,
      tenantId,
    },
  })

  if (!account) return null

  return {
    id: account.id,
    tenantId: account.tenantId,
    name: account.name,
    description: account.description || undefined,
    lastUsedAt: account.lastUsedAt || undefined,
    expiresAt: account.expiresAt || undefined,
    revokedAt: account.revokedAt || undefined,
    createdBy: account.createdBy || undefined,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  }
}

/**
 * Revoke a service account
 */
export async function revokeServiceAccount(
  tenantId: string,
  id: number
): Promise<void> {
  await prisma.serviceAccount.updateMany({
    where: {
      id,
      tenantId,
    },
    data: {
      revokedAt: new Date(),
      updatedAt: new Date(),
    },
  })
}

/**
 * Delete a service account (permanent)
 */
export async function deleteServiceAccount(
  tenantId: string,
  id: number
): Promise<void> {
  await prisma.serviceAccount.deleteMany({
    where: {
      id,
      tenantId,
    },
  })
}
