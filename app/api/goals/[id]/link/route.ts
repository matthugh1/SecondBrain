import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as goalsRepo from '@/lib/db/repositories/goals'
import { calculateGoalProgress } from '@/lib/services/goals'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const goalId = parseInt(params.id, 10)
    const body = await request.json()
    const { projectId, ideaId, weight } = body

    if (projectId) {
      await goalsRepo.linkProjectToGoal(tenantId, goalId, projectId, weight || 1.0)
    } else if (ideaId) {
      await goalsRepo.linkIdeaToGoal(tenantId, goalId, ideaId, weight || 1.0)
    } else {
      return NextResponse.json(
        { error: 'projectId or ideaId is required' },
        { status: 400 }
      )
    }

    // Recalculate progress
    await calculateGoalProgress(tenantId, goalId)

    const goal = await goalsRepo.getGoalById(tenantId, goalId)
    return NextResponse.json({ goal })
  } catch (error) {
    console.error('Error linking item to goal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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

    const goalId = parseInt(params.id, 10)
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')
    const ideaId = searchParams.get('ideaId')

    if (projectId) {
      await goalsRepo.unlinkProjectFromGoal(tenantId, goalId, parseInt(projectId, 10))
    } else if (ideaId) {
      await goalsRepo.unlinkIdeaFromGoal(tenantId, goalId, parseInt(ideaId, 10))
    } else {
      return NextResponse.json(
        { error: 'projectId or ideaId is required' },
        { status: 400 }
      )
    }

    // Recalculate progress
    await calculateGoalProgress(tenantId, goalId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error unlinking item from goal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
