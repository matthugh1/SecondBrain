import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as emailsRepo from '@/lib/db/repositories/emails'
import { fetchEmailsFromGmail } from '@/lib/services/email-capture'

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
    console.error('Error fetching emails:', error)
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
    const { sync } = body

    if (sync === 'gmail') {
      // Fetch emails from Gmail
      await fetchEmailsFromGmail(tenantId).catch(err =>
        console.error('Error syncing Gmail:', err)
      )
      return NextResponse.json({ success: true, message: 'Gmail sync initiated' })
    }

    // Process incoming email (webhook)
    const { processIncomingEmail } = await import('@/lib/services/email-capture')
    const result = await processIncomingEmail(tenantId, {
      messageId: body.messageId || `webhook-${Date.now()}`,
      subject: body.subject || '',
      body: body.body || body.text || '',
      senderEmail: body.senderEmail || body.from || '',
      senderName: body.senderName,
      recipientEmail: body.recipientEmail || body.to || '',
      receivedAt: body.receivedAt ? new Date(body.receivedAt) : new Date(),
      attachments: body.attachments,
    })

    return NextResponse.json({ success: true, email: result })
  } catch (error: any) {
    console.error('Error processing email:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
