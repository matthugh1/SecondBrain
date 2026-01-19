import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId, userId } = tenantCheck

  // Verify user is updating their own tenant
  if (params.id !== tenantId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Check if user has owner/admin role
  const membership = await prisma.membership.findUnique({
    where: {
      userId_tenantId: {
        userId,
        tenantId,
      },
    },
  })

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: { name },
    })

    return NextResponse.json({ success: true, tenant })
  } catch (error) {
    console.error('Error updating tenant:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
