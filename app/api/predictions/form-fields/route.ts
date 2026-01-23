import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import { predictFormFields } from '@/lib/services/predictions'

export async function GET(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId, userId } = tenantCheck

    const searchParams = request.nextUrl.searchParams
    const fieldType = searchParams.get('fieldType') as 'category' | 'tags' | 'related'

    if (!fieldType) {
      return NextResponse.json(
        { error: 'fieldType is required' },
        { status: 400 }
      )
    }

    const predictions = await predictFormFields(tenantId, userId!, fieldType)

    return NextResponse.json({ predictions })
  } catch (error) {
    console.error('Error generating form field predictions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
