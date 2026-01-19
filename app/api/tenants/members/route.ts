import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const memberships = await prisma.membership.findMany({
      where: { tenantId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    const members = memberships.map((m) => ({
      id: m.id,
      userId: m.userId,
      email: m.user.email,
      name: m.user.name,
      image: m.user.image,
      role: m.role,
      joinedAt: m.createdAt.toISOString(),
    }))

    return NextResponse.json({ members })
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
