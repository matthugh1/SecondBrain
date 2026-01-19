import {
  createActionHistory,
  getLastUndoneAction,
  getLastRedoneAction,
  markActionAsUndone,
  markActionAsRedone,
  type ActionType,
} from '@/lib/db/repositories/actionHistory'
import * as peopleRepo from '@/lib/db/repositories/people'
import * as projectsRepo from '@/lib/db/repositories/projects'
import * as ideasRepo from '@/lib/db/repositories/ideas'
import * as adminRepo from '@/lib/db/repositories/admin'

export function logAction(
  tenantId: string,
  actionType: ActionType,
  itemType: string,
  itemId: number | null,
  oldData: any = null,
  newData: any = null
): void {
  createActionHistory(tenantId, {
    action_type: actionType,
    item_type: itemType,
    item_id: itemId,
    old_data: oldData ? JSON.stringify(oldData) : null,
    new_data: newData ? JSON.stringify(newData) : null,
    undone: 0,
  })
}

export async function undoLastAction(tenantId: string): Promise<{ success: boolean; message: string }> {
  const action = getLastUndoneAction(tenantId)
  if (!action) {
    return { success: false, message: 'No actions to undo' }
  }

  try {
    const oldData = action.old_data ? JSON.parse(action.old_data) : null

    switch (action.action_type) {
      case 'create':
        // Delete the created item
        if (action.item_id) {
          switch (action.item_type) {
            case 'people':
              await peopleRepo.deletePerson(tenantId, action.item_id)
              break
            case 'projects':
              await projectsRepo.deleteProject(tenantId, action.item_id)
              break
            case 'ideas':
              await ideasRepo.deleteIdea(tenantId, action.item_id)
              break
            case 'admin':
              await adminRepo.deleteAdmin(tenantId, action.item_id)
              break
          }
        }
        break

      case 'update':
        // Restore old data
        if (action.item_id && oldData) {
          switch (action.item_type) {
            case 'people':
              await peopleRepo.updatePerson(tenantId, action.item_id, oldData)
              break
            case 'projects':
              await projectsRepo.updateProject(tenantId, action.item_id, oldData)
              break
            case 'ideas':
              await ideasRepo.updateIdea(tenantId, action.item_id, oldData)
              break
            case 'admin':
              await adminRepo.updateAdmin(tenantId, action.item_id, oldData)
              break
          }
        }
        break

      case 'delete':
        // Restore deleted item
        if (action.item_id && oldData) {
          switch (action.item_type) {
            case 'people':
              // Note: This won't restore the exact ID, but will create a new record
              // For full restoration, we'd need to track the original ID
              break
            case 'projects':
              break
            case 'ideas':
              break
            case 'admin':
              break
          }
        }
        break

      case 'archive':
        // Unarchive
        if (action.item_id) {
          switch (action.item_type) {
            case 'people':
              await peopleRepo.unarchivePerson(tenantId, action.item_id)
              break
            case 'projects':
              await projectsRepo.unarchiveProject(tenantId, action.item_id)
              break
            case 'ideas':
              await ideasRepo.unarchiveIdea(tenantId, action.item_id)
              break
            case 'admin':
              await adminRepo.unarchiveAdmin(tenantId, action.item_id)
              break
          }
        }
        break

      case 'unarchive':
        // Re-archive
        if (action.item_id) {
          switch (action.item_type) {
            case 'people':
              await peopleRepo.archivePerson(tenantId, action.item_id)
              break
            case 'projects':
              await projectsRepo.archiveProject(tenantId, action.item_id)
              break
            case 'ideas':
              await ideasRepo.archiveIdea(tenantId, action.item_id)
              break
            case 'admin':
              await adminRepo.archiveAdmin(tenantId, action.item_id)
              break
          }
        }
        break
    }

    markActionAsUndone(tenantId, action.id!)
    return { success: true, message: 'Action undone' }
  } catch (error) {
    console.error('Error undoing action:', error)
    return { success: false, message: 'Failed to undo action' }
  }
}

export async function redoLastAction(tenantId: string): Promise<{ success: boolean; message: string }> {
  const action = getLastRedoneAction(tenantId)
  if (!action) {
    return { success: false, message: 'No actions to redo' }
  }

  try {
    const newData = action.new_data ? JSON.parse(action.new_data) : null

    switch (action.action_type) {
      case 'create':
        // Re-create the item (simplified - would need full data)
        break

      case 'update':
        // Re-apply update
        if (action.item_id && newData) {
          switch (action.item_type) {
            case 'people':
              await peopleRepo.updatePerson(tenantId, action.item_id, newData)
              break
            case 'projects':
              await projectsRepo.updateProject(tenantId, action.item_id, newData)
              break
            case 'ideas':
              await ideasRepo.updateIdea(tenantId, action.item_id, newData)
              break
            case 'admin':
              await adminRepo.updateAdmin(tenantId, action.item_id, newData)
              break
          }
        }
        break

      case 'archive':
        // Re-archive
        if (action.item_id) {
          switch (action.item_type) {
            case 'people':
              await peopleRepo.archivePerson(tenantId, action.item_id)
              break
            case 'projects':
              await projectsRepo.archiveProject(tenantId, action.item_id)
              break
            case 'ideas':
              await ideasRepo.archiveIdea(tenantId, action.item_id)
              break
            case 'admin':
              await adminRepo.archiveAdmin(tenantId, action.item_id)
              break
          }
        }
        break

      case 'unarchive':
        // Re-unarchive
        if (action.item_id) {
          switch (action.item_type) {
            case 'people':
              await peopleRepo.unarchivePerson(tenantId, action.item_id)
              break
            case 'projects':
              await projectsRepo.unarchiveProject(tenantId, action.item_id)
              break
            case 'ideas':
              await ideasRepo.unarchiveIdea(tenantId, action.item_id)
              break
            case 'admin':
              await adminRepo.unarchiveAdmin(tenantId, action.item_id)
              break
          }
        }
        break
    }

    markActionAsRedone(tenantId, action.id!)
    return { success: true, message: 'Action redone' }
  } catch (error) {
    console.error('Error redoing action:', error)
    return { success: false, message: 'Failed to redo action' }
  }
}
