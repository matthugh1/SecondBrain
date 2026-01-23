import { NextRequest, NextResponse } from 'next/server'
import * as adminRepo from '@/lib/db/repositories/admin'
import { requireTenant } from '@/lib/auth/utils'
import type { Admin } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      )
    }

    const data = await adminRepo.getAdminById(tenantId, id)

    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error(`Error fetching admin/${params.id}:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    console.log(`PATCH /api/admin/${id}`, { body, tenantId })

    // Handle status updates specially to trigger completion logic
    if (body.status !== undefined) {
      const validStatuses = ['Todo', 'In Progress', 'Blocked', 'Waiting', 'Done', 'Cancelled']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status: ${body.status}. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        )
      }
      await adminRepo.updateTaskStatus(tenantId, id, body.status)
    } else {
      // For other updates, use the general updateAdmin function
      await adminRepo.updateAdmin(tenantId, id, body as Partial<Admin>)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error(`Error updating admin/${params.id}:`, error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { error: error.message || 'Internal server error', details: error.toString() },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      )
    }

    await adminRepo.deleteAdmin(tenantId, id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error deleting admin/${params.id}:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
