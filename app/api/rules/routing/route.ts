import { NextRequest, NextResponse } from 'next/server'
import {
  getAllRuleRouting,
  createRuleRouting,
} from '@/lib/db/repositories/rules'
import { requireTenant } from '@/lib/auth/utils'

export async function GET() {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const routing = await getAllRuleRouting(tenantId)
    return NextResponse.json(routing)
  } catch (error) {
    console.error('Error fetching rule routing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const body = await request.json()
    const id = await createRuleRouting(tenantId, body)
    return NextResponse.json({ id, ...body }, { status: 201 })
  } catch (error) {
    console.error('Error creating rule routing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
