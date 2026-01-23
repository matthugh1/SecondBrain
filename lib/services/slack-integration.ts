import * as integrationsRepo from '@/lib/db/repositories/integrations'
import * as captureService from './capture'
import { prisma } from '@/lib/db/index'

/**
 * Process Slack message event
 */
export async function processSlackMessage(
  tenantId: string,
  event: {
    type: string
    text: string
    user: string
    channel: string
    ts: string
    thread_ts?: string
  }
): Promise<{ success: boolean; captured?: any; error?: string }> {
  const integration = await integrationsRepo.getIntegrationByProvider(tenantId, 'slack')
  if (!integration || integration.status !== 'active') {
    return { success: false, error: 'Slack integration not active' }
  }

  // Check if message is a capture command (mentions bot or starts with capture command)
  const isCaptureCommand = event.text.includes('@secondbrain') || 
                          event.text.toLowerCase().startsWith('/capture') ||
                          event.text.toLowerCase().startsWith('capture:')

  if (!isCaptureCommand) {
    return { success: false, error: 'Not a capture command' }
  }

  // Extract capture text (remove command prefix)
  let captureText = event.text
    .replace(/@secondbrain\s*/gi, '')
    .replace(/^\/capture\s*/i, '')
    .replace(/^capture:\s*/i, '')

  if (!captureText.trim()) {
    return { success: false, error: 'No capture text provided' }
  }

  try {
    // Capture the message
    const captureResult = await captureService.captureMessage(tenantId, captureText)

    // Store Slack message record
    await prisma.slackMessage.create({
      data: {
        tenantId,
        integrationId: integration.id,
        messageId: event.ts,
        channelId: event.channel,
        userId: event.user,
        text: event.text,
        threadTs: event.thread_ts || null,
        capturedAs: captureResult.category || null,
        linkedItemId: (captureResult as any).itemId ? parseInt((captureResult as any).itemId, 10) : null,
      },
    })

    // Send confirmation back to Slack
    await sendSlackMessage(
      tenantId,
      event.channel,
      `✅ Captured: "${captureText.substring(0, 50)}${captureText.length > 50 ? '...' : ''}" as ${captureResult.category || 'item'}`
    )

    return { success: true, captured: captureResult }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Send message to Slack channel
 */
export async function sendSlackMessage(
  tenantId: string,
  channelId: string,
  text: string,
  blocks?: any[]
): Promise<{ success: boolean; error?: string }> {
  const integration = await integrationsRepo.getIntegrationByProvider(tenantId, 'slack')
  if (!integration || integration.status !== 'active') {
    return { success: false, error: 'Slack integration not active' }
  }

  const accessToken = integration.config.accessToken
  if (!accessToken) {
    return { success: false, error: 'No access token available' }
  }

  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: channelId,
        text,
        ...(blocks ? { blocks } : {}),
      }),
    })

    const data = await response.json()

    if (!data.ok) {
      return { success: false, error: data.error || 'Failed to send message' }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Post update to Slack when item changes
 */
export async function postUpdateToSlack(
  tenantId: string,
  update: {
    type: 'project_status' | 'task_completed' | 'important_capture'
    itemType: string
    itemId: number
    itemName: string
    details?: string
    channelId?: string
  }
): Promise<void> {
  const integration = await integrationsRepo.getIntegrationByProvider(tenantId, 'slack')
  if (!integration || integration.status !== 'active') {
    return
  }

  const channelId = update.channelId || integration.config.defaultChannel
  if (!channelId) {
    return // No channel configured
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const itemUrl = `${baseUrl}/${update.itemType}/${update.itemId}`

  let message = ''
  switch (update.type) {
    case 'project_status':
      message = `📊 Project "${update.itemName}" status updated: ${update.details}`
      break
    case 'task_completed':
      message = `✅ Task completed: "${update.itemName}"`
      break
    case 'important_capture':
      message = `📝 Important capture: "${update.itemName}"`
      break
  }

  if (message) {
    await sendSlackMessage(tenantId, channelId, `${message}\n${itemUrl}`)
  }
}
