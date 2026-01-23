import { NextRequest, NextResponse } from 'next/server'
import * as peopleRepo from '@/lib/db/repositories/people'
import * as projectsRepo from '@/lib/db/repositories/projects'
import * as ideasRepo from '@/lib/db/repositories/ideas'
import * as adminRepo from '@/lib/db/repositories/admin'
import { getLogIdsForItems } from '@/lib/db/repositories/inbox-log'
import { requireTenant } from '@/lib/auth/utils'
import type { Person, Project, Idea, Admin } from '@/types'

const validDatabases = ['people', 'projects', 'ideas', 'admin']

export async function GET(
  request: NextRequest,
  { params }: { params: { database: string } }
) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const { database } = params
    const searchParams = request.nextUrl.searchParams

    if (!validDatabases.includes(database)) {
      return NextResponse.json(
        { error: 'Invalid database' },
        { status: 400 }
      )
    }

    const includeArchived = searchParams.get('archived') === 'true'
    const dueDate = searchParams.get('dueDate')
    let data: any[] = []

    switch (database) {
      case 'people':
        data = await peopleRepo.getAllPeople(tenantId, includeArchived)
        break
      case 'projects':
        data = await projectsRepo.getAllProjects(tenantId, includeArchived)
        break
      case 'ideas':
        data = await ideasRepo.getAllIdeas(tenantId, includeArchived)
        break
      case 'admin':
        // If dueDate filter is provided, use the specialized query function
        if (dueDate) {
          data = await adminRepo.getAdminTasksDueOnDate(tenantId, dueDate)
        } else {
          data = await adminRepo.getAllAdmin(tenantId, includeArchived)
        }
        break
    }

    // Apply filters
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    if (status) {
      data = data.filter(item => item.status === status)
    }

    if (priority) {
      data = data.filter(item => item.priority === priority)
    }

    if (dateFrom || dateTo) {
      data = data.filter(item => {
        const itemDate = item.updated_at || item.created_at || item.created
        if (!itemDate) return false
        
        if (dateFrom && itemDate < dateFrom) return false
        if (dateTo && itemDate > dateTo) return false
        return true
      })
    }

    // Get logIds for all items to enable fix functionality
    const itemIds = data.map(item => item.id).filter((id): id is number => typeof id === 'number')
    const logIdMap = await getLogIdsForItems(tenantId, database, itemIds)
    
    // Add logId to each item if it exists
    const dataWithLogIds = data.map(item => ({
      ...item,
      logId: logIdMap[item.id] || null,
    }))

    return NextResponse.json(dataWithLogIds)
  } catch (error) {
    console.error(`Error fetching ${params.database}:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { database: string } }
) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const { database } = params

    if (!validDatabases.includes(database)) {
      return NextResponse.json(
        { error: 'Invalid database' },
        { status: 400 }
      )
    }

    const body = await request.json()
    let id: number

    switch (database) {
      case 'people':
        id = await peopleRepo.createPerson(tenantId, body as Person)
        break
      case 'projects':
        id = await projectsRepo.createProject(tenantId, body as Project)
        break
      case 'ideas':
        id = await ideasRepo.createIdea(tenantId, body as Idea)
        break
      case 'admin':
        id = await adminRepo.createAdmin(tenantId, body as Admin)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid database' },
          { status: 400 }
        )
    }

    return NextResponse.json({ id, ...body }, { status: 201 })
  } catch (error) {
    console.error(`Error creating ${params.database}:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
