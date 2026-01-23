import { NextRequest, NextResponse } from 'next/server'
import { processSlackMessage } from '@/lib/services/slack-integration'
import { validateSlackWebhook } from '@/lib/integrations/slack-verification'
import { getIntegrationBySlackTeamId } from '@/lib/db/repositories/integrations'

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature before processing
    const signingSecret = process.env.SLACK_SIGNING_SECRET || process.env.SLACK_WEBHOOK_SECRET
    
    if (!signingSecret) {
      console.error('SLACK_SIGNING_SECRET or SLACK_WEBHOOK_SECRET not configured')
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      )
    }

    // Get raw body for signature verification (must read before JSON parsing)
    const bodyText = await request.text()
    const signature = request.headers.get('x-slack-signature')
    const timestamp = request.headers.get('x-slack-request-timestamp')
    
    // Verify signature
    const verification = validateSlackWebhook(bodyText, signature, timestamp, signingSecret)
    if (!verification.isValid) {
      console.error('Slack webhook verification failed:', verification.error)
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse body after verification
    const body = JSON.parse(bodyText)

    // Handle URL verification challenge (Slack requires this for webhook setup)
    if (body.type === 'url_verification') {
      return NextResponse.json({ challenge: body.challenge })
    }

    // Handle Slack events
    if (body.type === 'event_callback') {
      const event = body.event

      // SECURITY: Lookup tenant from Integration table using team_id
      // DO NOT trust team_id from request body - it could be spoofed
      const teamId = body.team_id
      if (!teamId) {
        return NextResponse.json(
          { error: 'Missing team_id' },
          { status: 400 }
        )
      }

      // Lookup integration by Slack team_id to get tenantId
      const integration = await getIntegrationBySlackTeamId(teamId)
      if (!integration) {
        console.error(`No active Slack integration found for team_id: ${teamId}`)
        return NextResponse.json(
          { error: 'Integration not found' },
          { status: 404 }
        )
      }

      const tenantId = integration.tenantId

      if (event.type === 'app_mention' || event.type === 'message') {
        // Process message for capture
        await processSlackMessage(tenantId, {
          type: event.type,
          text: event.text || '',
          user: event.user || '',
          channel: event.channel || '',
          ts: event.ts || '',
          thread_ts: event.thread_ts,
        }).catch(err => console.error('Error processing Slack message:', err))
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error handling Slack webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
