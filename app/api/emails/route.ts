import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as emailsRepo from '@/lib/db/repositories/emails'
import { fetchEmailsFromGmail } from '@/lib/services/email-capture'
import { validateRequest } from '@/lib/middleware/validate-request'
import { handleError } from '@/lib/middleware/error-handler'
import { emailPostSchema } from '@/lib/validation/schemas'

export async function GET(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const senderEmail = searchParams.get('sender')
    const classifiedAs = searchParams.get('classifiedAs')
    const linkedPersonId = searchParams.get('linkedPersonId')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    let emails: any[]

    if (query) {
      emails = await emailsRepo.searchEmails(tenantId, query, limit)
    } else {
      emails = await emailsRepo.getEmails(tenantId, {
        senderEmail: senderEmail || undefined,
        classifiedAs: classifiedAs as any,
        linkedPersonId: linkedPersonId ? parseInt(linkedPersonId, 10) : undefined,
        limit,
        offset,
      })
    }

    return NextResponse.json({ emails })
  } catch (error) {
    return handleError(error, '/api/emails')
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    // Validate request body
    const validation = await validateRequest(emailPostSchema, request)
    if (!validation.success) {
      return validation.response
    }

    const { data } = validation

    // Handle Gmail sync
    if ('sync' in data && data.sync === 'gmail') {
      await fetchEmailsFromGmail(tenantId).catch(err =>
        console.error('Error syncing Gmail:', err)
      )
      return NextResponse.json({ success: true, message: 'Gmail sync initiated' })
    }

    // Process incoming email (webhook)
    // Type guard: ensure we have webhook data (not sync)
    if ('sync' in data && data.sync === 'gmail') {
      return NextResponse.json({ error: 'Sync request already handled' }, { status: 400 })
    }
    
    const webhookData = data as Extract<typeof data, { messageId?: string }>
    const { processIncomingEmail } = await import('@/lib/services/email-capture')
    const result = await processIncomingEmail(tenantId, {
      messageId: webhookData.messageId || `webhook-${Date.now()}`,
      subject: webhookData.subject || '',
      body: webhookData.body || webhookData.text || '',
      senderEmail: webhookData.senderEmail || webhookData.from || '',
      senderName: webhookData.senderName,
      recipientEmail: webhookData.recipientEmail || webhookData.to || '',
      receivedAt: webhookData.receivedAt ? new Date(webhookData.receivedAt) : new Date(),
      attachments: webhookData.attachments,
    })

    return NextResponse.json({ success: true, email: result })
  } catch (error) {
    return handleError(error, '/api/emails')
  }
}
