import crypto from 'crypto'
import { prisma } from '@/lib/db'

/**
 * Generate a secure random token for service accounts
 * Format: sa_<random 32 bytes hex>
 */
export function generateServiceAccountToken(): string {
  const randomBytes = crypto.randomBytes(32)
  return `sa_${randomBytes.toString('hex')}`
}

/**
 * Hash a service account token for storage
 * Uses SHA-256 (one-way hash, cannot be reversed)
 */
export function hashServiceAccountToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Verify a service account token against a hash
 */
export function verifyServiceAccountToken(
  token: string,
  hash: string
): boolean {
  const tokenHash = hashServiceAccountToken(token)
  return crypto.timingSafeEqual(
    Buffer.from(tokenHash),
    Buffer.from(hash)
  )
}

/**
 * Extract token from Authorization header
 * Format: "Bearer sa_..."
 */
export function extractServiceAccountToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7).trim()
  if (!token.startsWith('sa_')) {
    return null
  }
  
  return token
}

/**
 * Validate and lookup service account by token
 * Returns service account with tenantId if valid, null otherwise
 */
export async function validateServiceAccountToken(
  token: string
): Promise<{ tenantId: string; serviceAccountId: number } | null> {
  const tokenHash = hashServiceAccountToken(token)
  
  const serviceAccount = await prisma.serviceAccount.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      tenantId: true,
      revokedAt: true,
      expiresAt: true,
    },
  })

  if (!serviceAccount) {
    return null
  }

  // Check if revoked
  if (serviceAccount.revokedAt) {
    return null
  }

  // Check if expired
  if (serviceAccount.expiresAt && serviceAccount.expiresAt < new Date()) {
    return null
  }

  // Update last used timestamp (non-blocking)
  prisma.serviceAccount.update({
    where: { id: serviceAccount.id },
    data: { lastUsedAt: new Date() },
  }).catch(err => {
    console.error('Failed to update service account lastUsedAt:', err)
  })

  return {
    tenantId: serviceAccount.tenantId,
    serviceAccountId: serviceAccount.id,
  }
}
