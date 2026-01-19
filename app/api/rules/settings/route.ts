import { NextRequest, NextResponse } from 'next/server'
import { getRuleSettings, updateRuleSettings } from '@/lib/db/repositories/rules'
import { requireTenant } from '@/lib/auth/utils'

export async function GET() {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const settings = await getRuleSettings(tenantId)
    if (!settings) {
      return NextResponse.json(
        { error: 'Rule settings not found' },
        { status: 404 }
      )
    }
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching rule settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const body = await request.json()
    await updateRuleSettings(tenantId, body)
    const updated = await getRuleSettings(tenantId)
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating rule settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
