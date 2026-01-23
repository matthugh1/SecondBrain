import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as plansRepo from '@/lib/db/repositories/plans'
import { generatePlan } from '@/lib/services/action-planner'

export async function GET(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId, userId } = tenantCheck

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as plansRepo.PlanStatus | undefined

    const plans = await plansRepo.getAllPlans(tenantId, userId, status)

    return NextResponse.json({ plans })
  } catch (error) {
    console.error('Error fetching plans:', error)
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

    const body = await request.json() as any
    const { request: planRequest, name, description, steps, generate } = body

    let planData: any

    if (generate && planRequest) {
      // Generate plan from request
      const generatedPlan = await generatePlan(planRequest)
      planData = {
        name: name || generatedPlan.name,
        description: description || generatedPlan.description,
        request: planRequest,
        steps: generatedPlan.steps,
      }
    } else if (name && steps) {
      // Create plan from provided data
      planData = {
        name,
        description,
        request: planRequest || `Plan: ${name}`,
        steps,
      }
    } else {
      return NextResponse.json(
        { error: 'Either (generate=true and request) or (name and steps) are required' },
        { status: 400 }
      )
    }

    const planId = await plansRepo.createPlan(tenantId, userId, planData)
    const plan = await plansRepo.getPlanById(tenantId, planId)

    return NextResponse.json({ plan })
  } catch (error) {
    console.error('Error creating plan:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
