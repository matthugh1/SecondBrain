import { NextRequest, NextResponse } from 'next/server'
import * as peopleRepo from '@/lib/db/repositories/people'
import * as projectsRepo from '@/lib/db/repositories/projects'
import * as ideasRepo from '@/lib/db/repositories/ideas'
import * as adminRepo from '@/lib/db/repositories/admin'
import { requireTenant } from '@/lib/auth/utils'
import type { Person, Project, Idea, Admin } from '@/types'

const validDatabases = ['people', 'projects', 'ideas', 'admin']

export async function GET(
  request: NextRequest,
  { params }: { params: { database: string; id: string } }
) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const { database, id } = params
    const recordId = parseInt(id)

    if (!validDatabases.includes(database) || isNaN(recordId)) {
      return NextResponse.json(
        { error: 'Invalid database or ID' },
        { status: 400 }
      )
    }

    let data: any = null

    switch (database) {
      case 'people':
        data = await peopleRepo.getPersonById(tenantId, recordId)
        break
      case 'projects':
        data = await projectsRepo.getProjectById(tenantId, recordId)
        break
      case 'ideas':
        data = await ideasRepo.getIdeaById(tenantId, recordId)
        break
      case 'admin':
        data = await adminRepo.getAdminById(tenantId, recordId)
        break
    }

    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error(`Error fetching ${params.database}/${params.id}:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { database: string; id: string } }
) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const { database, id } = params
    const recordId = parseInt(id)

    if (!validDatabases.includes(database) || isNaN(recordId)) {
      return NextResponse.json(
        { error: 'Invalid database or ID' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Get old data for logging
    let oldData: any = null
    switch (database) {
      case 'people':
        oldData = await peopleRepo.getPersonById(tenantId, recordId)
        await peopleRepo.updatePerson(tenantId, recordId, body as Partial<Person>)
        break
      case 'projects':
        oldData = await projectsRepo.getProjectById(tenantId, recordId)
        await projectsRepo.updateProject(tenantId, recordId, body as Partial<Project>)
        break
      case 'ideas':
        oldData = await ideasRepo.getIdeaById(tenantId, recordId)
        await ideasRepo.updateIdea(tenantId, recordId, body as Partial<Idea>)
        break
      case 'admin':
        oldData = await adminRepo.getAdminById(tenantId, recordId)
        await adminRepo.updateAdmin(tenantId, recordId, body as Partial<Admin>)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid database' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error updating ${params.database}/${params.id}:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { database: string; id: string } }
) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const { database, id } = params
    const recordId = parseInt(id)

    if (!validDatabases.includes(database) || isNaN(recordId)) {
      return NextResponse.json(
        { error: 'Invalid database or ID' },
        { status: 400 }
      )
    }

    // Get old data for logging
    let oldData: any = null
    switch (database) {
      case 'people':
        oldData = await peopleRepo.getPersonById(tenantId, recordId)
        await peopleRepo.deletePerson(tenantId, recordId)
        break
      case 'projects':
        oldData = await projectsRepo.getProjectById(tenantId, recordId)
        await projectsRepo.deleteProject(tenantId, recordId)
        break
      case 'ideas':
        oldData = await ideasRepo.getIdeaById(tenantId, recordId)
        await ideasRepo.deleteIdea(tenantId, recordId)
        break
      case 'admin':
        oldData = await adminRepo.getAdminById(tenantId, recordId)
        await adminRepo.deleteAdmin(tenantId, recordId)
        break
      default:
        return NextResponse.json(
          { error: 'Invalid database' },
          { status: 400 }
        )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error deleting ${params.database}/${params.id}:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
