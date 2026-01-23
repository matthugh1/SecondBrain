import * as emailsRepo from '@/lib/db/repositories/emails'
import * as integrationsRepo from '@/lib/db/repositories/integrations'
import * as peopleRepo from '@/lib/db/repositories/people'
import * as captureService from './capture'
import * as classificationService from './classification'
import { OpenAI } from 'openai'
import type { Category } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Process incoming email
 */
export async function processIncomingEmail(
  tenantId: string,
  emailData: {
    messageId: string
    subject: string
    body: string
    senderEmail: string
    senderName?: string
    recipientEmail: string
    receivedAt: Date
    attachments?: Array<{ name: string; url: string; size: number }>
  }
): Promise<{ emailId: number; classifiedAs?: Category; linkedPersonId?: number }> {
  // Get Gmail integration
  const integration = await integrationsRepo.getIntegrationByProvider(tenantId, 'gmail')
  if (!integration || integration.status !== 'active') {
    throw new Error('Gmail integration not active')
  }

  // Create email record
  const emailId = await emailsRepo.createEmail(tenantId, integration.id, emailData)

  // Find or create person from sender email
  let linkedPersonId: number | undefined
  const existingPerson = await peopleRepo.getPersonByEmail(tenantId, emailData.senderEmail)
  if (existingPerson) {
    linkedPersonId = existingPerson.id
  } else {
    // Create person from email
    const personId = await peopleRepo.createPerson(tenantId, {
      name: emailData.senderName || emailData.senderEmail.split('@')[0],
      context: `Contact from email: ${emailData.subject}`,
    })
    linkedPersonId = personId
  }

  // Classify email
  const classification = await classificationService.classifyMessage(
    tenantId,
    `${emailData.subject}\n\n${emailData.body}`
  )

  // Update email with classification and links
  await emailsRepo.updateEmailLinks(tenantId, emailId, {
    classifiedAs: classification.category,
    linkedPersonId,
  })

  // Extract action items and create tasks if needed
  if (classification.category === 'admin' || emailData.body.toLowerCase().includes('action') || emailData.body.toLowerCase().includes('todo')) {
    await extractAndCreateTasks(tenantId, emailId, emailData, linkedPersonId)
  }

  return {
    emailId,
    classifiedAs: classification.category,
    linkedPersonId,
  }
}

/**
 * Extract action items from email and create tasks
 */
async function extractAndCreateTasks(
  tenantId: string,
  emailId: number,
  emailData: { subject: string; body: string },
  linkedPersonId?: number
): Promise<void> {
  try {
    const prompt = `Extract action items from this email. Return a JSON array of action items, each with:
- name: task name
- dueDate: due date if mentioned (ISO format or null)
- notes: relevant context

Email Subject: ${emailData.subject}
Email Body: ${emailData.body}

Return ONLY a JSON array, no markdown formatting. Example:
[{"name": "Follow up with client", "dueDate": "2024-01-15", "notes": "From email conversation"}]

If no action items, return empty array [].`

    const { retryAICall } = await import('@/lib/utils/retry')
    const { timeoutAICall } = await import('@/lib/utils/timeout')
    // Apply retry and timeout to AI API call
    const response = await retryAICall(() =>
      timeoutAICall(
        openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that extracts action items from emails. Always return valid JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' },
        })
      )
    )

    const content = response.choices[0]?.message?.content
    if (!content) return

    const result = JSON.parse(content)
    const actionItems = Array.isArray(result) ? result : result.actionItems || []

    // Create admin tasks for each action item
    const { createAdmin } = await import('@/lib/db/repositories/admin')
    for (const item of actionItems) {
      if (item.name) {
        await createAdmin(tenantId, {
          name: item.name,
          notes: item.notes || `From email: ${emailData.subject}`,
          due_date: item.dueDate ? new Date(item.dueDate).toISOString() : undefined,
        })

        // Link email to the created task
        await emailsRepo.updateEmailLinks(tenantId, emailId, {
          linkedAdminId: undefined, // Will be set after task creation
        })
      }
    }
  } catch (error) {
    console.error('Error extracting action items:', error)
    // Don't fail email processing if action extraction fails
  }
}

/**
 * Fetch emails from Gmail API
 */
export async function fetchEmailsFromGmail(
  tenantId: string,
  maxResults: number = 10
): Promise<void> {
  const integration = await integrationsRepo.getIntegrationByProvider(tenantId, 'gmail')
  if (!integration || integration.status !== 'active') {
    throw new Error('Gmail integration not active')
  }

  const accessToken = integration.config.accessToken
  if (!accessToken) {
    throw new Error('No access token available')
  }

  // Fetch messages from Gmail API (with retry and timeout)
  const { fetchWithRetryAndTimeout } = await import('@/lib/utils/timeout')
  const messagesResponse = await fetchWithRetryAndTimeout(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!messagesResponse.ok) {
    throw new Error(`Gmail API error: ${messagesResponse.statusText}`)
  }

  const messagesData = await messagesResponse.json()
  const messages = messagesData.messages || []

  // Process each message
  for (const message of messages) {
    try {
      // Get full message details (with retry and timeout)
      const { fetchWithRetryAndTimeout } = await import('@/lib/utils/timeout')
      const messageResponse = await fetchWithRetryAndTimeout(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      if (!messageResponse.ok) continue

      const messageData = await messageResponse.json()
      const headers = messageData.payload.headers || []
      
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || ''
      const from = headers.find((h: any) => h.name === 'From')?.value || ''
      const to = headers.find((h: any) => h.name === 'To')?.value || ''
      const date = headers.find((h: any) => h.name === 'Date')?.value

      // Extract email address from "Name <email@domain.com>" format
      const senderMatch = from.match(/<(.+)>/)
      const senderEmail = senderMatch ? senderMatch[1] : from
      const senderName = from.replace(/<.+>/, '').trim() || undefined

      // Extract body text
      let body = ''
      if (messageData.payload.body?.data) {
        body = Buffer.from(messageData.payload.body.data, 'base64').toString('utf-8')
      } else if (messageData.payload.parts) {
        for (const part of messageData.payload.parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            body = Buffer.from(part.body.data, 'base64').toString('utf-8')
            break
          }
        }
      }

      // Check if email already exists
      const existingEmail = await emailsRepo.getEmails(tenantId, { limit: 1 })
      const alreadyProcessed = existingEmail.some(e => e.messageId === message.id)

      if (!alreadyProcessed) {
        await processIncomingEmail(tenantId, {
          messageId: message.id,
          subject,
          body,
          senderEmail,
          senderName,
          recipientEmail: to,
          receivedAt: date ? new Date(date) : new Date(),
        })
      }
    } catch (error) {
      console.error(`Error processing message ${message.id}:`, error)
    }
  }

  // Update last sync time
  await integrationsRepo.updateLastSync(tenantId, 'gmail')
}
