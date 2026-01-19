import { NextResponse } from 'next/server'
import { clearAllData } from '@/lib/db/repositories/maintenance'
import { requireTenant } from '@/lib/auth/utils'

export async function POST() {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DB_RESET !== 'true') {
      return NextResponse.json(
        { error: 'Database reset is disabled in production' },
        { status: 403 }
      )
    }

    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const result = clearAllData(tenantId)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('Error resetting database:', error)
    return NextResponse.json(
      { error: 'Failed to reset database' },
      { status: 500 }
    )
  }
}
