import { NextResponse } from 'next/server'
import { redoLastAction } from '@/lib/services/actionHistory'
import { requireTenant } from '@/lib/auth/utils'

export async function POST() {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const result = await redoLastAction(tenantId)
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (error) {
    console.error('Error redoing action:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
