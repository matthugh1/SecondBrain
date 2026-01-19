import { getInboxLogById, updateInboxLog } from '@/lib/db/repositories/inbox-log'
import * as peopleRepo from '@/lib/db/repositories/people'
import * as projectsRepo from '@/lib/db/repositories/projects'
import * as ideasRepo from '@/lib/db/repositories/ideas'
import * as adminRepo from '@/lib/db/repositories/admin'
import { getAllRuleCategories } from '@/lib/db/repositories/rules'
import { createCorrection } from '@/lib/db/repositories/classification-learning'
import type { Category } from '@/types'

export interface FixResult {
  success: boolean
  message: string
  newCategory: Category
  destinationName?: string
  destinationUrl?: string
}

function getDestinationUrl(database: Category, id: number): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/${database}/${id}`
}

export async function fixClassification(
  tenantId: string,
  logId: number,
  newCategory: Category
): Promise<FixResult> {
  try {
    // Find the original inbox log entry
    const inboxLog = await getInboxLogById(tenantId, logId)
    if (!inboxLog) {
      return {
        success: false,
        message: 'Could not find original message to fix.',
        newCategory,
      }
    }

    // Validate category - allow fixing to any category (not just enabled ones)
    // Fixing is a manual override, so users should be able to fix to any category
    const allCategories = await getAllRuleCategories(tenantId)
    const validCategoryKeys = allCategories.map(c => c.category_key)
    
    // Fallback to standard categories if database query fails
    const standardCategories = ['people', 'projects', 'ideas', 'admin']
    const finalValidKeys = validCategoryKeys.length > 0 ? validCategoryKeys : standardCategories
    
    if (!finalValidKeys.includes(newCategory)) {
      return {
        success: false,
        message: `Invalid category. Must be one of: ${finalValidKeys.join(', ')}`,
        newCategory,
      }
    }

    // If the original was already filed, we need to move it
    if (inboxLog.status === 'Filed' && inboxLog.notion_record_id) {
      const oldRecordId = parseInt(inboxLog.notion_record_id)
      const oldCategory = inboxLog.filed_to as Category

      // Delete old record
      switch (oldCategory) {
        case 'people':
          await peopleRepo.deletePerson(tenantId, oldRecordId)
          break
        case 'projects':
          await projectsRepo.deleteProject(tenantId, oldRecordId)
          break
        case 'ideas':
          await ideasRepo.deleteIdea(tenantId, oldRecordId)
          break
        case 'admin':
          await adminRepo.deleteAdmin(tenantId, oldRecordId)
          break
      }

      // Create new record in the correct category
      // We'll use the original text and create a simple record
      // In a more sophisticated version, we could re-run classification with guidance
      const { classifyMessage } = await import('./classification')
      const classification = await classifyMessage(tenantId, inboxLog.original_text)
      
      // Override category with user's correction
      classification.category = newCategory
      
      // Ensure name field exists - use original text as fallback if classification didn't extract a name
      if (!classification.fields.name || classification.fields.name.trim() === '') {
        classification.fields.name = inboxLog.original_text.trim().slice(0, 200) // Limit length
      }
      
      // Create record in new category
      const { createRecord } = await import('./capture')
      const result = await createRecord(tenantId, newCategory, classification.fields)

      // Update inbox log
      await updateInboxLog(tenantId, inboxLog.id!, {
        status: 'Fixed',
        filed_to: newCategory,
        destination_name: result.name,
        destination_url: result.url,
        notion_record_id: result.id.toString(),
      })

      // Record correction for learning
      try {
        await createCorrection(tenantId, {
          inbox_log_id: inboxLog.id!,
          original_category: oldCategory,
          corrected_category: newCategory,
          message_text: inboxLog.original_text,
        })
      } catch (error) {
        console.error('Failed to record classification correction:', error)
        // Don't fail the fix operation if learning recording fails
      }

      return {
        success: true,
        message: `Fixed! Re-filed to ${newCategory}: ${result.name}`,
        newCategory,
        destinationName: result.name,
        destinationUrl: result.url,
      }
    } else {
      // If it was marked for review, update the category and re-process
      const { classifyMessage } = await import('./classification')
      const classification = await classifyMessage(tenantId, inboxLog.original_text)
      classification.category = newCategory
      
      // Ensure name field exists - use original text as fallback if classification didn't extract a name
      if (!classification.fields.name || classification.fields.name.trim() === '') {
        classification.fields.name = inboxLog.original_text.trim().slice(0, 200) // Limit length
      }
      
      const { createRecord } = await import('./capture')
      const result = await createRecord(tenantId, newCategory, classification.fields)
      
      // Update inbox log
      await updateInboxLog(tenantId, inboxLog.id!, {
        filed_to: newCategory,
        status: 'Fixed',
        destination_name: result.name,
        destination_url: result.url,
        notion_record_id: result.id.toString(),
      })

      // Record correction for learning
      try {
        await createCorrection(tenantId, {
          inbox_log_id: inboxLog.id!,
          original_category: inboxLog.filed_to as string,
          corrected_category: newCategory,
          message_text: inboxLog.original_text,
        })
      } catch (error) {
        console.error('Failed to record classification correction:', error)
        // Don't fail the fix operation if learning recording fails
      }

      return {
        success: true,
        message: `Fixed! Filed to ${newCategory}: ${result.name}`,
        newCategory,
        destinationName: result.name,
        destinationUrl: result.url,
      }
    }
  } catch (error) {
    console.error('Error fixing classification:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'
    return {
      success: false,
      message: `Error processing fix: ${errorMessage}`,
      newCategory,
    }
  }
}
