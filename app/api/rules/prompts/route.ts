import { NextRequest, NextResponse } from 'next/server'
import {
  getAllRulePrompts,
  createRulePrompt,
  setActivePrompt,
} from '@/lib/db/repositories/rules'
import { requireTenant } from '@/lib/auth/utils'

export async function GET() {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const prompts = await getAllRulePrompts(tenantId)
    return NextResponse.json(prompts)
  } catch (error) {
    console.error('Error fetching rule prompts:', error)
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
    const id = await createRulePrompt(tenantId, body)
    return NextResponse.json({ id, ...body }, { status: 201 })
  } catch (error) {
    console.error('Error creating rule prompt:', error)
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
    if (body.action === 'setActive' && body.name) {
      await setActivePrompt(tenantId, body.name)
      const prompts = await getAllRulePrompts(tenantId)
      return NextResponse.json(prompts)
    }
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating rule prompts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
