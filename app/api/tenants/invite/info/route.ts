import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

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

    return NextResponse.json({
      tenantName: invite.tenant.name,
      email: invite.email,
      role: invite.role,
    })
  } catch (error) {
    console.error('Error fetching invite info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
