import { getServerSession } from 'next-auth'
import { authOptions } from './config'
import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

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
): Promise<{ tenantId: string; userId?: string } | NextResponse> {
  // Check for API key authentication first
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const apiKey = authHeader.substring(7)
    const expectedApiKey = process.env.MCP_API_KEY
    
    if (expectedApiKey && apiKey === expectedApiKey) {
      // API key is valid - try to get tenantId from request body or session
      let tenantId: string | null = null
      
      // First, try to get from request body if provided
      if (body?.tenantId) {
        tenantId = body.tenantId
      } else {
        // Fall back to session if available
        const session = await getSession()
        if (session?.user?.id) {
          tenantId = await getActiveTenantId()
        }
      }
      
      if (tenantId) {
        return { tenantId }
      }
      
      // If no tenantId found, return error
      return NextResponse.json(
        { error: 'API key authentication requires tenantId in request body or an active session' },
        { status: 403 }
      )
    }
  }
  
  // Fall back to session-based authentication
  return requireTenant()
}
