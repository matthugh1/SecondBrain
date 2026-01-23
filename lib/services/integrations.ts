import * as integrationsRepo from '@/lib/db/repositories/integrations'
import { prisma } from '@/lib/db/index'

/**
 * Get OAuth configuration for a provider
 */
export function getOAuthConfig(provider: integrationsRepo.IntegrationProvider): {
  clientId: string
  clientSecret: string
  authUrl: string
  tokenUrl: string
  scopes: string[]
} {
  const configs: Record<string, any> = {
    gmail: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'],
    },
    google_calendar: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'],
    },
    slack: {
      clientId: process.env.SLACK_CLIENT_ID || '',
      clientSecret: process.env.SLACK_CLIENT_SECRET || '',
      authUrl: 'https://slack.com/oauth/v2/authorize',
      tokenUrl: 'https://slack.com/api/oauth.v2.access',
      scopes: ['chat:write', 'channels:read', 'channels:history', 'users:read'],
    },
    notion: {
      clientId: process.env.NOTION_CLIENT_ID || '',
      clientSecret: process.env.NOTION_CLIENT_SECRET || '',
      authUrl: 'https://api.notion.com/v1/oauth/authorize',
      tokenUrl: 'https://api.notion.com/v1/oauth/token',
      scopes: ['read', 'write'],
    },
    outlook: {
      clientId: process.env.MICROSOFT_CLIENT_ID || '',
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
      authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      scopes: ['https://graph.microsoft.com/Mail.Read', 'https://graph.microsoft.com/Mail.Send'],
    },
  }

  return configs[provider] || {
    clientId: '',
    clientSecret: '',
    authUrl: '',
    tokenUrl: '',
    scopes: [],
  }
}

/**
 * Generate OAuth authorization URL
 */
export function generateOAuthUrl(
  provider: integrationsRepo.IntegrationProvider,
  redirectUri: string,
  state?: string
): string {
  const config = getOAuthConfig(provider)
  
  if (!config.clientId) {
    const envVarName = provider === 'outlook' 
      ? 'MICROSOFT_CLIENT_ID' 
      : provider === 'gmail' || provider === 'google_calendar'
      ? 'GOOGLE_CLIENT_ID'
      : provider === 'slack'
      ? 'SLACK_CLIENT_ID'
      : provider === 'notion'
      ? 'NOTION_CLIENT_ID'
      : 'CLIENT_ID'
    
    const providerName = provider === 'outlook' ? 'Outlook' 
      : provider === 'gmail' ? 'Gmail'
      : provider === 'google_calendar' ? 'Google Calendar'
      : provider === 'slack' ? 'Slack'
      : provider === 'notion' ? 'Notion'
      : provider
    
    throw new Error(
      `OAuth configuration missing: ${envVarName} environment variable is not set. ` +
      `Please add ${envVarName} to your .env.local file. ` +
      (provider === 'outlook' 
        ? `For ${providerName}, you'll need to create an Azure app registration (one-time setup, ~5 minutes). Personal Microsoft accounts can do this without admin access. See OUTLOOK_SETUP.md for details.`
        : `For ${providerName}, you'll need to set up OAuth credentials.`)
    )
  }
  
  if (!config.authUrl) {
    throw new Error(`OAuth configuration missing: authUrl is not configured for provider ${provider}`)
  }
  
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    ...(state ? { state } : {}),
  })

  return `${config.authUrl}?${params.toString()}`
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  provider: integrationsRepo.IntegrationProvider,
  code: string,
  redirectUri: string
): Promise<Record<string, any>> {
  const config = getOAuthConfig(provider)
  
  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  })

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token exchange failed: ${error}`)
  }

  return await response.json()
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(
  provider: integrationsRepo.IntegrationProvider,
  refreshToken: string
): Promise<Record<string, any>> {
  const config = getOAuthConfig(provider)
  
  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })

  const response = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  })

  if (!response.ok) {
    throw new Error('Token refresh failed')
  }

  return await response.json()
}

/**
 * Store webhook event
 */
export async function storeWebhookEvent(
  tenantId: string,
  integrationId: number,
  eventType: string,
  payload: Record<string, any>
): Promise<number> {
  const result = await prisma.webhookEvent.create({
    data: {
      tenantId,
      integrationId,
      eventType,
      payload: JSON.stringify(payload),
      status: 'pending',
    },
  })
  return result.id
}

/**
 * Process webhook event
 */
export async function processWebhookEvent(
  tenantId: string,
  eventId: number
): Promise<void> {
  const event = await prisma.webhookEvent.findFirst({
    where: {
      id: eventId,
      tenantId,
      status: 'pending',
    },
    include: {
      integration: true,
    },
  })

  if (!event) {
    throw new Error('Webhook event not found')
  }

  try {
    // Process based on integration provider and event type
    // This is a placeholder - actual processing would be provider-specific
    await prisma.webhookEvent.updateMany({
      where: {
        id: eventId,
        tenantId,
      },
      data: {
        status: 'processed',
        processedAt: new Date(),
      },
    })
  } catch (error: any) {
    await prisma.webhookEvent.updateMany({
      where: {
        id: eventId,
        tenantId,
      },
      data: {
        status: 'failed',
        errorMessage: error.message,
      },
    })
    throw error
  }
}
