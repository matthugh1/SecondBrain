import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    const invite = await prisma.invite.findUnique({
      where: { token },
      include: { tenant: true },
    })

    if (!invite) {
      return NextResponse.json({ error: 'Invalid invite' }, { status: 404 })
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Invite expired' }, { status: 400 })
    }

    if (invite.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Email mismatch' },
        { status: 403 }
      )
    }

    // Check if user already has membership
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_tenantId: {
          userId: session.user.id,
          tenantId: invite.tenantId,
        },
      },
    })

    if (existingMembership) {
      return NextResponse.json(
        { error: 'Already a member' },
        { status: 400 }
      )
    }

    // Create membership
    await prisma.membership.create({
      data: {
        userId: session.user.id,
        tenantId: invite.tenantId,
        role: invite.role,
      },
    })

    // Delete invite
    await prisma.invite.delete({
      where: { id: invite.id },
    })

    return NextResponse.json({ success: true, tenantId: invite.tenantId })
  } catch (error) {
    console.error('Error accepting invite:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
