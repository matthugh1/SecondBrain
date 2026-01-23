import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import { getAutocompleteSuggestions } from '@/lib/services/autocomplete'

export async function GET(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const type = searchParams.get('type') as 'people' | 'projects' | 'tags' | 'categories' | null

    if (!query || query.length < 2) {
      return NextResponse.json({ options: [] })
    }

    const types: Array<'person' | 'project' | 'idea' | 'tag'> = []
    if (!type || type === 'people') types.push('person')
    if (!type || type === 'projects') types.push('project')
    if (!type || type === 'tags') types.push('tag')

    const suggestions = await getAutocompleteSuggestions(tenantId, query, types)

    return NextResponse.json({
      options: suggestions.map((s, idx) => ({
        id: s.value + idx,
        label: s.value,
        type: s.type,
      })),
    })
  } catch (error) {
    console.error('Error fetching autocomplete:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
