import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as userProfileRepo from '@/lib/db/repositories/user-profile'
import * as userAnalyticsRepo from '@/lib/db/repositories/user-analytics'

export async function GET(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId, userId } = tenantCheck

    const [profile, analytics] = await Promise.all([
      userProfileRepo.getUserProfile(tenantId, userId),
      userAnalyticsRepo.getUserAnalytics(tenantId, userId),
    ])

    return NextResponse.json({
      profile,
      analytics,
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
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
    const { preferences, frequentPeople, activeFocusAreas } = body

    await userProfileRepo.updateUserProfile(tenantId, userId, {
      preferences,
      frequentPeople,
      activeFocusAreas,
    })

    // Rebuild profile from data
    await userProfileRepo.buildUserProfile(tenantId, userId).catch(err =>
      console.error('Error rebuilding profile:', err)
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
