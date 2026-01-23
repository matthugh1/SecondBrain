import { getServerSession } from 'next-auth'
import { authOptions } from './config'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'
import {
  extractServiceAccountToken,
  validateServiceAccountToken,
} from './service-account'

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user
}

export async function getActiveTenantId(): Promise<string | null> {
  const session = await getSession()
  if (!session?.user?.id) return null
  
  const token = (session as any).activeTenantId
  if (token) return token
  
  // Fallback: get first membership
  const membership = await prisma.membership.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
  })
  
  return membership?.tenantId || null
}

export async function requireAuth() {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

export async function requireTenant() {
  const authError = await requireAuth()
  if (authError) return authError
  
  const tenantId = await getActiveTenantId()
  if (!tenantId) {
    return NextResponse.json({ error: 'No active tenant' }, { status: 403 })
  }
  
  return { tenantId, userId: (await getCurrentUser())!.id }
}

export async function verifyTenantAccess(tenantId: string, userId: string): Promise<boolean> {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_tenantId: {
        userId,
        tenantId,
      },
    },
  })
  return !!membership
}

export async function requireTenantOrApiKey(
  request: Request,
  body?: { tenantId?: string }
): Promise<{ tenantId: string; userId?: string; serviceAccountId?: number } | NextResponse> {
  const authHeader = request.headers.get('authorization')
  
  if (authHeader?.startsWith('Bearer ')) {
    // Check for service account token first (sa_...)
    const serviceAccountToken = extractServiceAccountToken(authHeader)
    if (serviceAccountToken) {
      const validation = await validateServiceAccountToken(serviceAccountToken)
      if (validation) {
        // Service account token is valid - return tenantId
        return {
          tenantId: validation.tenantId,
          serviceAccountId: validation.serviceAccountId,
        }
      }
      // Invalid or revoked service account token
      return NextResponse.json(
        { error: 'Invalid or revoked service account token' },
        { status: 401 }
      )
    }

    // Legacy API key support (for backward compatibility, but deprecated)
    // TODO: Remove this once all MCP servers use service accounts
    const apiKey = authHeader.substring(7)
    const expectedApiKey = process.env.MCP_API_KEY
    
    if (expectedApiKey && apiKey === expectedApiKey) {
      // SECURITY: Legacy API key auth requires session-based tenant lookup
      // DO NOT accept tenantId from request body - it could be spoofed
      const session = await getSession()
      
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Legacy API key authentication requires an active session. Please use service account tokens instead.' },
          { status: 401 }
        )
      }

      const tenantId = await getActiveTenantId()
      if (!tenantId) {
        return NextResponse.json(
          { error: 'No active tenant found for user' },
          { status: 403 }
        )
      }

      // Verify user has access to this tenant
      const hasAccess = await verifyTenantAccess(tenantId, session.user.id)
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'User does not have access to tenant' },
          { status: 403 }
        )
      }

      return { tenantId, userId: session.user.id }
    }
  }
  
  // Fall back to session-based authentication
  return requireTenant()
}
