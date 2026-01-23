import { classifyMessage } from './classification'
import * as peopleRepo from '@/lib/db/repositories/people'
import * as projectsRepo from '@/lib/db/repositories/projects'
import * as ideasRepo from '@/lib/db/repositories/ideas'
import * as adminRepo from '@/lib/db/repositories/admin'
import * as inboxLogRepo from '@/lib/db/repositories/inbox-log'
import * as calendarRepo from '@/lib/db/repositories/calendar'
import { getRuleSettings } from '@/lib/db/repositories/rules'
import { formatMeetingContextForItem } from './calendar-context'
import { generateAndStoreEmbedding } from './semantic-search'
import { detectRelationshipsForItem } from './relationship-engine'
import * as userAnalyticsRepo from '@/lib/db/repositories/user-analytics'
import { prisma } from '@/lib/db'
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
  fields: Record<string, any>,
  meetingContext?: string
): Promise<{ id: number; name: string; url: string }> {
  // Ensure fields is an object
  if (!fields || typeof fields !== 'object') {
    fields = {}
  }
  
  // Helper function to append meeting context to a field, avoiding duplicates
  const appendMeetingContext = (existingValue: string | undefined, context: string): string => {
    if (!context) return existingValue || ''
    
    // Check if context already contains this meeting info to avoid duplicates
    if (existingValue && existingValue.includes(context)) {
      return existingValue
    }
    
    // Append with separator
    if (existingValue && existingValue.trim()) {
      return `${existingValue}\n\n${context}`
    }
    return context
  }
  
  let id: number
  let name: string

  switch (category) {
    case 'people': {
      // Ensure name is a non-empty string
      const personName = (fields.name && typeof fields.name === 'string' && fields.name.trim())
        ? fields.name.trim().slice(0, 500) // Limit length to prevent issues
        : 'Unknown'
      
      // Append meeting context to context field if provided
      let contextValue = fields.context && typeof fields.context === 'string' ? fields.context : undefined
      if (meetingContext) {
        contextValue = appendMeetingContext(contextValue, meetingContext)
      }
      
      // Ensure optional fields are strings or undefined (not other types)
      const person: Person = {
        name: personName,
        context: contextValue,
        follow_ups: fields.follow_ups && typeof fields.follow_ups === 'string' ? fields.follow_ups : undefined,
        last_touched: new Date().toISOString().split('T')[0],
        tags: fields.tags && typeof fields.tags === 'string' ? fields.tags : undefined,
      }
      id = await peopleRepo.createPerson(tenantId, person)
      name = person.name
      // Generate embedding asynchronously (don't block on this)
      generateAndStoreEmbedding(tenantId, 'people', id, person.name, [person.context, person.follow_ups].filter(Boolean).join(' ')).catch(err => console.error('Error generating embedding:', err))
      break
    }

    case 'projects': {
      const settings = await getRuleSettings(tenantId)
      
      // Append meeting context to notes field if provided
      let notesValue = fields.notes && typeof fields.notes === 'string' ? fields.notes : undefined
      if (meetingContext) {
        notesValue = appendMeetingContext(notesValue, meetingContext)
      }
      
      const project: Project = {
        name: fields.name || 'Untitled Project',
        status: fields.status || settings?.default_project_status || 'Active',
        next_action: fields.next_action,
        notes: notesValue,
      }
      id = await projectsRepo.createProject(tenantId, project)
      name = project.name
      // Generate embedding asynchronously (don't block on this)
      generateAndStoreEmbedding(tenantId, 'projects', id, project.name, [project.status, project.next_action, project.notes].filter(Boolean).join(' ')).catch(err => console.error('Error generating embedding:', err))
      break
    }

    case 'ideas': {
      // Append meeting context to notes field if provided
      let notesValue = fields.notes && typeof fields.notes === 'string' ? fields.notes : undefined
      if (meetingContext) {
        notesValue = appendMeetingContext(notesValue, meetingContext)
      }
      
      const idea: Idea = {
        name: fields.name || 'Untitled Idea',
        one_liner: fields.one_liner,
        notes: notesValue,
        last_touched: new Date().toISOString().split('T')[0],
        tags: fields.tags,
      }
      id = await ideasRepo.createIdea(tenantId, idea)
      name = idea.name
      // Generate embedding asynchronously (don't block on this)
      generateAndStoreEmbedding(tenantId, 'ideas', id, idea.name, [idea.one_liner, idea.notes].filter(Boolean).join(' ')).catch(err => console.error('Error generating embedding:', err))
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
      
      // Append meeting context to notes field if provided
      let notesValue = fields.notes && typeof fields.notes === 'string' ? fields.notes : undefined
      if (meetingContext) {
        notesValue = appendMeetingContext(notesValue, meetingContext)
      }
      
      const admin: Admin = {
        name: fields.name || 'Untitled Task',
        due_date: dueDate,
        status: fields.status || settings?.default_admin_status || 'Todo',
        notes: notesValue,
        created: new Date().toISOString(),
      }
      id = await adminRepo.createAdmin(tenantId, admin)
      name = admin.name
      // Generate embedding asynchronously (don't block on this)
      generateAndStoreEmbedding(tenantId, 'admin', id, admin.name, [admin.status, admin.notes].filter(Boolean).join(' ')).catch(err => console.error('Error generating embedding:', err))
      break
    }

    default:
      throw new Error(`Unknown category: ${category}`)
  }

  const url = getDestinationUrl(category, id)
  
  // Detect relationships asynchronously (don't block on this)
  const itemText = `${name} ${JSON.stringify(fields)}`.trim()
  detectRelationshipsForItem(tenantId, category, id, itemText).catch(err => 
    console.error('Error detecting relationships:', err)
  )
  
  return { id, name, url }
}

export async function captureMessage(
  tenantId: string,
  messageText: string,
  userId?: string
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

    // Log extracted fields for debugging (using structured logger)
    const { getContextLogger } = await import('@/lib/logger/context')
    const logger = getContextLogger()
    logger.debug({ fields: classification.fields }, 'Extracted fields from classification')
    if (classification.fields.due_date) {
      logger.debug({ dueDate: classification.fields.due_date }, 'Due date extracted')
    }

    // Determine if we should file this or mark for review
    const shouldFile = classification.confidence >= confidenceThreshold
    const filedTo: Category | 'Needs Review' = shouldFile
      ? classification.category
      : 'Needs Review'

    // TRANSACTION: Create record and inbox log atomically
    let destinationName: string | undefined
    let destinationUrl: string | undefined
    let recordId: string | undefined
    let logId: number = 0 // Initialize to satisfy TypeScript (will always be assigned in transaction)

    await prisma.$transaction(async (tx) => {
      if (shouldFile) {
        // Check if user is currently in a meeting
        let meetingContext: string | undefined
        try {
          const currentMeeting = await calendarRepo.getCurrentMeeting(tenantId)
          if (currentMeeting) {
            meetingContext = formatMeetingContextForItem(currentMeeting)
          }
        } catch (error) {
          console.warn('Failed to get current meeting for context:', error)
          // Continue without meeting context if there's an error
        }
        
        // Create the record in the appropriate database
        const result = await createRecord(tenantId, classification.category, classification.fields, meetingContext)
        destinationName = result.name
        destinationUrl = result.url
        recordId = result.id.toString()
      }

      // Log to inbox_log (within transaction)
      logId = await inboxLogRepo.createInboxLog(tenantId, {
        original_text: messageText,
        filed_to: filedTo,
        destination_name: destinationName,
        destination_url: destinationUrl,
        confidence: classification.confidence,
        status: shouldFile ? 'Filed' : 'Needs Review',
        created: new Date().toISOString(),
        notion_record_id: recordId,
      })

      // For "Needs Review" items, create a link to the inbox log entry (within transaction)
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
    })

    // Track analytics if userId is provided
    if (userId && shouldFile) {
      const now = new Date()
      const hourOfDay = now.getHours()
      const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' })
      
      userAnalyticsRepo.recordCapture(
        tenantId,
        userId,
        classification.category,
        classification.confidence,
        hourOfDay,
        dayOfWeek
      ).catch(err => console.error('Error recording analytics:', err))
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
