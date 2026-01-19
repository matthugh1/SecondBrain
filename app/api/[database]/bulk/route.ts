import { NextRequest, NextResponse } from 'next/server'
import * as peopleRepo from '@/lib/db/repositories/people'
import * as projectsRepo from '@/lib/db/repositories/projects'
import * as ideasRepo from '@/lib/db/repositories/ideas'
import * as adminRepo from '@/lib/db/repositories/admin'
import { logAction } from '@/lib/services/actionHistory'
import { requireTenant } from '@/lib/auth/utils'

const validDatabases = ['people', 'projects', 'ideas', 'admin']

export async function POST(
  request: NextRequest,
  { params }: { params: { database: string } }
) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const { database } = params
    const body = await request.json()
    const { action, ids, data } = body

    if (!validDatabases.includes(database)) {
      return NextResponse.json(
        { error: 'Invalid database' },
        { status: 400 }
      )
    }

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'action and ids array required' },
        { status: 400 }
      )
    }

    let results: { success: number; failed: number } = { success: 0, failed: 0 }

    switch (action) {
      case 'delete':
        for (const id of ids) {
          try {
            let oldData: any = null
            switch (database) {
              case 'people':
                oldData = await peopleRepo.getPersonById(tenantId, id)
                await peopleRepo.deletePerson(tenantId, id)
                break
              case 'projects':
                oldData = await projectsRepo.getProjectById(tenantId, id)
                await projectsRepo.deleteProject(tenantId, id)
                break
              case 'ideas':
                oldData = await ideasRepo.getIdeaById(tenantId, id)
                await ideasRepo.deleteIdea(tenantId, id)
                break
              case 'admin':
                oldData = await adminRepo.getAdminById(tenantId, id)
                await adminRepo.deleteAdmin(tenantId, id)
                break
            }
            if (oldData) {
              logAction(tenantId, 'bulk_delete', database, id, oldData, null)
            }
            results.success++
          } catch (err) {
            results.failed++
          }
        }
        break

      case 'archive':
        for (const id of ids) {
          try {
            let oldData: any = null
            switch (database) {
              case 'people':
                oldData = await peopleRepo.getPersonById(tenantId, id)
                await peopleRepo.archivePerson(tenantId, id)
                break
              case 'projects':
                oldData = await projectsRepo.getProjectById(tenantId, id)
                await projectsRepo.archiveProject(tenantId, id)
                break
              case 'ideas':
                oldData = await ideasRepo.getIdeaById(tenantId, id)
                await ideasRepo.archiveIdea(tenantId, id)
                break
              case 'admin':
                oldData = await adminRepo.getAdminById(tenantId, id)
                await adminRepo.archiveAdmin(tenantId, id)
                break
            }
            if (oldData) {
              logAction(tenantId, 'archive', database, id, oldData, { ...oldData, archived: true })
            }
            results.success++
          } catch (err) {
            results.failed++
          }
        }
        break

      case 'unarchive':
        for (const id of ids) {
          try {
            let oldData: any = null
            switch (database) {
              case 'people':
                oldData = await peopleRepo.getPersonById(tenantId, id)
                await peopleRepo.unarchivePerson(tenantId, id)
                break
              case 'projects':
                oldData = await projectsRepo.getProjectById(tenantId, id)
                await projectsRepo.unarchiveProject(tenantId, id)
                break
              case 'ideas':
                oldData = await ideasRepo.getIdeaById(tenantId, id)
                await ideasRepo.unarchiveIdea(tenantId, id)
                break
              case 'admin':
                oldData = await adminRepo.getAdminById(tenantId, id)
                await adminRepo.unarchiveAdmin(tenantId, id)
                break
            }
            if (oldData) {
              logAction(tenantId, 'unarchive', database, id, oldData, { ...oldData, archived: false })
            }
            results.success++
          } catch (err) {
            results.failed++
          }
        }
        break

      case 'update':
        if (!data) {
          return NextResponse.json(
            { error: 'data required for update action' },
            { status: 400 }
          )
        }
        for (const id of ids) {
          try {
            let oldData: any = null
            switch (database) {
              case 'people':
                oldData = await peopleRepo.getPersonById(tenantId, id)
                await peopleRepo.updatePerson(tenantId, id, data)
                break
              case 'projects':
                oldData = await projectsRepo.getProjectById(tenantId, id)
                await projectsRepo.updateProject(tenantId, id, data)
                break
              case 'ideas':
                oldData = await ideasRepo.getIdeaById(tenantId, id)
                await ideasRepo.updateIdea(tenantId, id, data)
                break
              case 'admin':
                oldData = await adminRepo.getAdminById(tenantId, id)
                await adminRepo.updateAdmin(tenantId, id, data)
                break
            }
            if (oldData) {
              logAction(tenantId, 'bulk_update', database, id, oldData, { ...oldData, ...data })
            }
            results.success++
          } catch (err) {
            results.failed++
          }
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: delete, archive, unarchive, update' },
          { status: 400 }
        )
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error(`Error in bulk operation for ${params.database}:`, error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
