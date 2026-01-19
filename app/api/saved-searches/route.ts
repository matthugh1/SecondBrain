import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireTenant } from '@/lib/auth/utils'

export async function GET() {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const searches = await prisma.savedSearch.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
    })
    
    // Parse filters JSON strings
    const searchesWithParsedFilters = searches.map(search => ({
      ...search,
      filters: search.filters ? JSON.parse(search.filters) : {},
    }))
    
    return NextResponse.json({ searches: searchesWithParsedFilters })
  } catch (error) {
    console.error('Error fetching saved searches:', error)
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
    const { tenantId } = tenantCheck

    const body = await request.json()
    const { name, query, filters } = body
    
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }
    
    const savedSearch = await prisma.savedSearch.create({
      data: {
        tenantId,
        name,
        query: query || '',
        filters: JSON.stringify(filters || {}),
      },
    })
    
    return NextResponse.json({ 
      id: savedSearch.id, 
      name: savedSearch.name, 
      query: savedSearch.query, 
      filters: savedSearch.filters ? JSON.parse(savedSearch.filters) : {} 
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating saved search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const body = await request.json()
    const { id, name, query, filters } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }
    
    const savedSearch = await prisma.savedSearch.update({
      where: {
        id: Number(id),
        tenantId,
      },
      data: {
        name,
        query: query || '',
        filters: JSON.stringify(filters || {}),
      },
    })
    
    return NextResponse.json({ 
      id: savedSearch.id, 
      name: savedSearch.name, 
      query: savedSearch.query, 
      filters: savedSearch.filters ? JSON.parse(savedSearch.filters) : {} 
    })
  } catch (error) {
    console.error('Error updating saved search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }
    
    // Verify the search belongs to this tenant
    const existing = await prisma.savedSearch.findFirst({
      where: { id: parseInt(id, 10), tenantId },
    })
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      )
    }
    
    await prisma.savedSearch.delete({
      where: { id: parseInt(id, 10) },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting saved search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
