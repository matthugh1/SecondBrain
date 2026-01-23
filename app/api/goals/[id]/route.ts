import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as goalsRepo from '@/lib/db/repositories/goals'
import { calculateGoalProgress } from '@/lib/services/goals'

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

    const goalId = parseInt(params.id, 10)
    const goal = await goalsRepo.getGoalById(tenantId, goalId)

    if (!goal) {
      return NextResponse.json(
        { error: 'Goal not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ goal })
  } catch (error) {
    console.error('Error fetching goal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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

    const goalId = parseInt(params.id, 10)
    const body = await request.json()
    const { name, description, targetDate, status, progress, progressMethod } = body

    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (targetDate !== undefined) updates.targetDate = targetDate ? new Date(targetDate) : null
    if (status !== undefined) updates.status = status
    if (progress !== undefined) updates.progress = progress
    if (progressMethod !== undefined) updates.progressMethod = progressMethod

    await goalsRepo.updateGoal(tenantId, goalId, updates)

    // Recalculate progress if auto mode
    if (progressMethod === 'auto_from_items' || body.recalculate) {
      await calculateGoalProgress(tenantId, goalId)
    }

    const goal = await goalsRepo.getGoalById(tenantId, goalId)
    return NextResponse.json({ goal })
  } catch (error) {
    console.error('Error updating goal:', error)
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
    await goalsRepo.deleteGoal(tenantId, goalId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting goal:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
