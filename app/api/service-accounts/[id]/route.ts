import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import {
  getServiceAccountById,
  revokeServiceAccount,
  deleteServiceAccount,
} from '@/lib/db/repositories/service-accounts'
import { handleError } from '@/lib/middleware/error-handler'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }

    const { tenantId } = tenantCheck
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid service account ID' },
        { status: 400 }
      )
    }

    const account = await getServiceAccountById(tenantId, id)
    if (!account) {
      return NextResponse.json(
        { error: 'Service account not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(account)
  } catch (error) {
    return handleError(error, `/api/service-accounts/${params.id}`)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }

    const { tenantId } = tenantCheck
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid service account ID' },
        { status: 400 }
      )
    }

    await deleteServiceAccount(tenantId, id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleError(error, `/api/service-accounts/${params.id}`)
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }

    const { tenantId } = tenantCheck
    const id = parseInt(params.id)

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid service account ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { action } = body

    if (action === 'revoke') {
      await revokeServiceAccount(tenantId, id)
      return NextResponse.json({ success: true, message: 'Service account revoked' })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    return handleError(error, `/api/service-accounts/${params.id}`)
  }
}
