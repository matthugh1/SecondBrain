import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const memberships = await prisma.membership.findMany({
      where: { userId: session.user.id },
      include: {
        tenant: true,
      },
      orderBy: { createdAt: 'asc' },
    })

    const tenants = memberships.map((m) => ({
      id: m.tenantId,
      name: m.tenant.name,
      role: m.role,
    }))

    return NextResponse.json({ tenants })
  } catch (error) {
    console.error('Error fetching tenants:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
