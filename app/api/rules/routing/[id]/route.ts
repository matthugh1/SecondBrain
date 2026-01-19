import { NextRequest, NextResponse } from 'next/server'
import {
  getAllRuleRouting,
  updateRuleRouting,
  deleteRuleRouting,
} from '@/lib/db/repositories/rules'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const id = parseInt(params.id)
    updateRuleRouting(id, body)
    const routing = getAllRuleRouting()
    const updated = routing.find(r => r.id === id)
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating rule routing:', error)
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
    const id = parseInt(params.id)
    deleteRuleRouting(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting rule routing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
