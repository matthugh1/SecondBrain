import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import { createServiceAccount, getServiceAccounts } from '@/lib/db/repositories/service-accounts'
import { validateRequest } from '@/lib/middleware/validate-request'
import { handleError } from '@/lib/middleware/error-handler'
import { z } from 'zod'

const createServiceAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  expiresAt: z.string().datetime().optional().transform((val) => val ? new Date(val) : undefined),
})

export async function GET(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }

    const { tenantId } = tenantCheck
    const accounts = await getServiceAccounts(tenantId)

    // Don't expose token hashes or other sensitive data
    return NextResponse.json(accounts)
  } catch (error) {
    return handleError(error, '/api/service-accounts')
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }

    const { tenantId, userId } = tenantCheck

    // Validate request body
    const validation = await validateRequest(createServiceAccountSchema, request)
    if (!validation.success) {
      return validation.response
    }

    const { data } = validation

    // Create service account
    const serviceAccount = await createServiceAccount({
      tenantId,
      name: data.name,
      description: data.description,
      expiresAt: data.expiresAt,
      createdBy: userId,
    })

    // Return service account with token (only time token is shown)
    return NextResponse.json(
      {
        id: serviceAccount.id,
        name: serviceAccount.name,
        description: serviceAccount.description,
        token: serviceAccount.token, // ⚠️ Only shown once - save immediately
        expiresAt: serviceAccount.expiresAt,
        createdAt: serviceAccount.createdAt,
      },
      { status: 201 }
    )
  } catch (error) {
    return handleError(error, '/api/service-accounts')
  }
}
