import { classifyMessage } from './classification'
import * as peopleRepo from '@/lib/db/repositories/people'
import * as projectsRepo from '@/lib/db/repositories/projects'
import * as ideasRepo from '@/lib/db/repositories/ideas'
import * as adminRepo from '@/lib/db/repositories/admin'
import * as inboxLogRepo from '@/lib/db/repositories/inbox-log'
import { getRuleSettings } from '@/lib/db/repositories/rules'
import type { Category, Person, Project, Idea, Admin } from '@/types'

export interface CaptureResult {
  success: boolean
  category: Category | 'Needs Review'
  destinationName?: string
  destinationUrl?: string
  confidence: number
  reasoning?: string
  message: string
  logId: number
  fields?: Record<string, any> // Extracted fields including dates
}

function getDestinationUrl(database: Category, id: number): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/${database}/${id}`
}

export async function createRecord(
  tenantId: string,
  category: Category,
  fields: Record<string, any>
): Promise<{ id: number; name: string; url: string }> {
  // Ensure fields is an object
  if (!fields || typeof fields !== 'object') {
    fields = {}
  }
  
  let id: number
  let name: string

  switch (category) {
    case 'people': {
      // Ensure name is a non-empty string
      const personName = (fields.name && typeof fields.name === 'string' && fields.name.trim())
        ? fields.name.trim().slice(0, 500) // Limit length to prevent issues
        : 'Unknown'
      
      // Ensure optional fields are strings or undefined (not other types)
      const person: Person = {
        name: personName,
        context: fields.context && typeof fields.context === 'string' ? fields.context : undefined,
        follow_ups: fields.follow_ups && typeof fields.follow_ups === 'string' ? fields.follow_ups : undefined,
        last_touched: new Date().toISOString().split('T')[0],
        tags: fields.tags && typeof fields.tags === 'string' ? fields.tags : undefined,
      }
      id = await peopleRepo.createPerson(tenantId, person)
      name = person.name
      break
    }

    case 'projects': {
      const settings = await getRuleSettings(tenantId)
      const project: Project = {
        name: fields.name || 'Untitled Project',
        status: fields.status || settings?.default_project_status || 'Active',
        next_action: fields.next_action,
        notes: fields.notes,
      }
      id = await projectsRepo.createProject(tenantId, project)
      name = project.name
      break
    }

    case 'ideas': {
      const idea: Idea = {
        name: fields.name || 'Untitled Idea',
        one_liner: fields.one_liner,
        notes: fields.notes,
        last_touched: new Date().toISOString().split('T')[0],
        tags: fields.tags,
      }
      id = await ideasRepo.createIdea(tenantId, idea)
      name = idea.name
      break
    }

    case 'admin': {
      const settings = await getRuleSettings(tenantId)
      
      // Validate and fix due_date if provided
      let dueDate = fields.due_date
      if (dueDate) {
        try {
          const date = new Date(dueDate)
          const now = new Date()
          
          if (isNaN(date.getTime())) {
            console.warn(`⚠️ Invalid date format: ${dueDate}`)
            dueDate = undefined
          } else {
            // Check if date is obviously wrong (more than 1 year in the past or 10 years in the future)
            const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
            const tenYearsFromNow = new Date(now.getFullYear() + 10, now.getMonth(), now.getDate())
            
            if (date < oneYearAgo) {
              console.warn(`⚠️ Date is in the past (more than 1 year ago): ${dueDate} (parsed as ${date.toISOString().split('T')[0]})`)
              // Still allow past dates, but log a warning
            } else if (date > tenYearsFromNow) {
              console.warn(`⚠️ Date is too far in the future (more than 10 years): ${dueDate} (parsed as ${date.toISOString().split('T')[0]})`)
              // Don't set the date if it's clearly wrong
              dueDate = undefined
            } else {
              // Normalize to ISO date format (YYYY-MM-DD)
              const normalizedDate = date.toISOString().split('T')[0]
              console.log(`✅ Valid due date: ${dueDate} → ${normalizedDate}`)
              dueDate = normalizedDate
            }
          }
        } catch (error) {
          console.warn(`⚠️ Failed to parse due_date: ${dueDate}`, error)
          dueDate = undefined
        }
      }
      
      const admin: Admin = {
        name: fields.name || 'Untitled Task',
        due_date: dueDate,
        status: fields.status || settings?.default_admin_status || 'Todo',
        notes: fields.notes,
        created: new Date().toISOString(),
      }
      id = await adminRepo.createAdmin(tenantId, admin)
      name = admin.name
      break
    }

    default:
      throw new Error(`Unknown category: ${category}`)
  }

  const url = getDestinationUrl(category, id)
  return { id, name, url }
}

export async function captureMessage(
  tenantId: string,
  messageText: string
): Promise<CaptureResult> {
  try {
    // Get confidence threshold from database
    const settings = await getRuleSettings(tenantId)
    const confidenceThreshold = settings?.confidence_threshold || 0.7

    // Check for ambiguous/greeting inputs that shouldn't be filed
    const lowerText = messageText.toLowerCase().trim()
    const isGreeting = /^(hi|hello|hey|greetings|good morning|good afternoon|good evening|sup|what's up|howdy)$/i.test(lowerText)
    const isTooShort = lowerText.length < 3
    const isAmbiguous = isGreeting || isTooShort

    // Classify the message
    const classification = await classifyMessage(tenantId, messageText)

    // Check if reasoning indicates this is ambiguous (greeting, unclear, etc.)
    const reasoningLower = classification.reasoning?.toLowerCase() || ''
    const indicatesAmbiguous = reasoningLower.includes('greeting') || 
                               reasoningLower.includes('unclear') || 
                               reasoningLower.includes('ambiguous') ||
                               reasoningLower.includes('does not provide specific information')

    // If ambiguous input detected, return helpful instructions instead of filing
    if (isAmbiguous || indicatesAmbiguous) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      
      const logId = await inboxLogRepo.createInboxLog(tenantId, {
        original_text: messageText,
        filed_to: 'Needs Review',
        destination_name: undefined,
        destination_url: undefined,
        confidence: classification.confidence,
        status: 'Needs Review',
        created: new Date().toISOString(),
        notion_record_id: undefined,
      })

      const destinationUrl = `${baseUrl}/inbox-log?highlight=${logId}`
      
      // Update the inbox log with the correct URL
      await inboxLogRepo.updateInboxLog(tenantId, logId, {
        destination_url: destinationUrl,
        destination_name: 'Review in Inbox Log',
      })

      return {
        success: true,
        category: 'Needs Review',
        destinationName: undefined,
        destinationUrl,
        confidence: classification.confidence,
        reasoning: classification.reasoning,
        message: `💡 This looks like a greeting or unclear input. This chat is for capturing thoughts and ideas to organize them. Try typing something like:\n\n• "John said he'll finish the report by Friday"\n• "Need to buy groceries"\n• "Interesting idea about renewable energy"\n\nI'll automatically categorize and file your thoughts for you!`,
        logId,
        fields: classification.fields,
      }
    }

    // Log extracted fields for debugging
    console.log('📋 Extracted fields:', classification.fields)
    if (classification.fields.due_date) {
      console.log('📅 Due date extracted:', classification.fields.due_date)
    }

    // Determine if we should file this or mark for review
    const shouldFile = classification.confidence >= confidenceThreshold
    const filedTo: Category | 'Needs Review' = shouldFile
      ? classification.category
      : 'Needs Review'

    let destinationName: string | undefined
    let destinationUrl: string | undefined
    let recordId: string | undefined

    if (shouldFile) {
      // Create the record in the appropriate database
      const result = await createRecord(tenantId, classification.category, classification.fields)
      destinationName = result.name
      destinationUrl = result.url
      recordId = result.id.toString()
    }

    // Log to inbox_log
    const logId = await inboxLogRepo.createInboxLog(tenantId, {
      original_text: messageText,
      filed_to: filedTo,
      destination_name: destinationName,
      destination_url: destinationUrl,
      confidence: classification.confidence,
      status: shouldFile ? 'Filed' : 'Needs Review',
      created: new Date().toISOString(),
      notion_record_id: recordId,
    })

    // For "Needs Review" items, create a link to the inbox log entry
    if (!shouldFile) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      destinationUrl = `${baseUrl}/inbox-log?highlight=${logId}`
      destinationName = 'Review in Inbox Log'
      // Update the inbox log with the correct URL
      await inboxLogRepo.updateInboxLog(tenantId, logId, {
        destination_url: destinationUrl,
        destination_name: destinationName,
      })
    }

    // Build response message
    let message: string
    if (shouldFile) {
      message = `✅ Filed to ${classification.category}: ${destinationName} (${(classification.confidence * 100).toFixed(0)}% confidence)`
    } else {
      message = `⚠️ Low confidence (${(classification.confidence * 100).toFixed(0)}%). Marked for review. Category: ${classification.category}`
    }

    return {
      success: true,
      category: filedTo,
      destinationName,
      destinationUrl,
      confidence: classification.confidence,
      reasoning: classification.reasoning,
      message,
      logId,
      fields: classification.fields,
    }
  } catch (error) {
    console.error('Error capturing message:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred'
    throw new Error(`Failed to capture message: ${errorMessage}`)
  }
}
