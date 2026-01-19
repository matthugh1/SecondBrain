import { NextRequest, NextResponse } from 'next/server'
import * as tagsRepo from '@/lib/db/repositories/tags'
import { requireTenant } from '@/lib/auth/utils'

export async function GET(request: NextRequest) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    
    if (query) {
      const tags = await tagsRepo.searchTags(tenantId, query)
      return NextResponse.json({ tags })
    } else {
      const tags = await tagsRepo.getAllTags(tenantId)
      return NextResponse.json({ tags })
    }
  } catch (error) {
    console.error('Error fetching tags:', error)
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
    const { name } = body
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }
    
    const id = await tagsRepo.createTag(tenantId, name)
    const tag = await tagsRepo.getTagById(tenantId, id)
    
    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error('Error creating tag:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
