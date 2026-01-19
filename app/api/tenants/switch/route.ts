import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/utils'
import { verifyTenantAccess } from '@/lib/auth/utils'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/config'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tenantId } = body

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 })
    }

    // Verify user has access to this tenant
    const hasAccess = await verifyTenantAccess(tenantId, session.user.id)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update session with new tenant
    // Note: This requires updating the session via NextAuth's update method
    // For now, we'll return success and the client will need to refresh
    return NextResponse.json({ success: true, tenantId })
  } catch (error) {
    console.error('Error switching tenant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
