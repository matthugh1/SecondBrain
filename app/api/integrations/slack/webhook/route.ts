import { NextRequest, NextResponse } from 'next/server'
import { processSlackMessage } from '@/lib/services/slack-integration'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Slack event verification
    if (body.type === 'url_verification') {
      return NextResponse.json({ challenge: body.challenge })
    }

    // Handle Slack events
    if (body.type === 'event_callback') {
      const event = body.event

      // Extract tenant ID from event (could be stored in app metadata or channel name)
      // For now, we'll need to determine tenant from integration
      // This is a simplified implementation
      const tenantId = body.team_id // Slack team ID could map to tenant

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
