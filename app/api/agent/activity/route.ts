import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as agentActivityRepo from '@/lib/db/repositories/agent-activity'

export async function GET(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId, userId } = tenantCheck

    const searchParams = request.nextUrl.searchParams
    const activityType = searchParams.get('activityType') as agentActivityRepo.ActivityType | undefined
    const status = searchParams.get('status') as agentActivityRepo.ActivityStatus | undefined
    const limit = parseInt(searchParams.get('limit') || '100', 10)

    const activities = await agentActivityRepo.getAgentActivities(tenantId, userId!, {
      activityType,
      status,
      limit,
    })

    return NextResponse.json({ activities })
  } catch (error) {
    console.error('Error fetching agent activities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
