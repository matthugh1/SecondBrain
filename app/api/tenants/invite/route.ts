import { NextRequest, NextResponse } from 'next/server'
import { getSession, requireTenant } from '@/lib/auth/utils'
import { prisma } from '@/lib/db'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId, userId } = tenantCheck

  try {
    // Check if user has admin/owner role
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

    const body = await request.json()
    const { email, role = 'member' } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!['owner', 'admin', 'member'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Check if user already has membership
    const existingUser = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          where: { tenantId },
        },
      },
    })

    if (existingUser && existingUser.memberships.length > 0) {
      return NextResponse.json(
        { error: 'User already has access to this workspace' },
        { status: 400 }
      )
    }

    // Create invite token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

    const invite = await prisma.invite.create({
      data: {
        tenantId,
        email,
        role,
        token,
        expiresAt,
      },
    })

    // In a real app, you'd send an email here
    // For now, return the invite link
    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteLink = `${baseUrl}/auth/accept-invite?token=${token}`

    return NextResponse.json({
      success: true,
      inviteId: invite.id,
      inviteLink,
      expiresAt: invite.expiresAt.toISOString(),
    })
  } catch (error) {
    console.error('Error creating invite:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
