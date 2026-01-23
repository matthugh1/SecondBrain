import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as agentSettingsRepo from '@/lib/db/repositories/agent-settings'

export async function GET(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId, userId } = tenantCheck

    const settings = await agentSettingsRepo.getAgentSettings(tenantId, userId!)

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error fetching agent settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId, userId } = tenantCheck

    const body = await request.json()
    const { proactivityLevel, approvalThreshold, autoApproveTypes, focusAreas, notificationPreferences } = body

    await agentSettingsRepo.upsertAgentSettings(tenantId, userId!, {
      proactivityLevel,
      approvalThreshold,
      autoApproveTypes,
      focusAreas,
      notificationPreferences,
    })

    const settings = await agentSettingsRepo.getAgentSettings(tenantId, userId!)

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Error updating agent settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
