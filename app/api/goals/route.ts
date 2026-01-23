import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as goalsRepo from '@/lib/db/repositories/goals'

export async function GET(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as 'active' | 'completed' | 'paused' | 'cancelled' | undefined

    const goals = await goalsRepo.getAllGoals(tenantId, status)

    return NextResponse.json({ goals })
  } catch (error) {
    console.error('Error fetching goals:', error)
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
    const { tenantId } = tenantCheck

    const body = await request.json()
    const { name, description, targetDate, progressMethod } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const goalId = await goalsRepo.createGoal(tenantId, {
      name,
      description,
      targetDate: targetDate ? new Date(targetDate) : undefined,
      progressMethod: progressMethod || 'manual',
    })

    const goal = await goalsRepo.getGoalById(tenantId, goalId)

    return NextResponse.json({ goal })
  } catch (error) {
    console.error('Error creating goal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
