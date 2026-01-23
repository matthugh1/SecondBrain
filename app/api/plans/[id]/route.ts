import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as plansRepo from '@/lib/db/repositories/plans'
import { executePlan } from '@/lib/services/plan-executor'

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

    const planId = parseInt(params.id, 10)
    const plan = await plansRepo.getPlanById(tenantId, planId)

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Error fetching plan:', error)
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
    const { tenantId, userId } = tenantCheck

    const planId = parseInt(params.id, 10)
    const body = await request.json()
    const { status, steps, approve } = body

    if (approve) {
      await plansRepo.updatePlanStatus(tenantId, planId, 'approved', new Date())
      const plan = await plansRepo.getPlanById(tenantId, planId)
      return NextResponse.json({ plan })
    }

    if (status) {
      await plansRepo.updatePlanStatus(tenantId, planId, status)
      const plan = await plansRepo.getPlanById(tenantId, planId)
      return NextResponse.json({ plan })
    }

    if (steps) {
      await plansRepo.updatePlanSteps(tenantId, planId, steps)
      const plan = await plansRepo.getPlanById(tenantId, planId)
      return NextResponse.json({ plan })
    }

    return NextResponse.json(
      { error: 'Must specify status, steps, or approve' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating plan:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId, userId } = tenantCheck

    const planId = parseInt(params.id, 10)
    const body = await request.json()
    const { execute } = body

    if (execute) {
      const result = await executePlan(tenantId, planId, userId!)

      if (!result.success) {
        return NextResponse.json(
          { error: 'Plan execution failed', errors: result.errors },
          { status: 500 }
        )
      }

      const plan = await plansRepo.getPlanById(tenantId, planId)
      return NextResponse.json({
        success: true,
        executedSteps: result.executedSteps,
        plan,
      })
    }

    return NextResponse.json(
      { error: 'Must specify execute=true' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error executing plan:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
