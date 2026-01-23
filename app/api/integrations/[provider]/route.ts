import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as integrationsRepo from '@/lib/db/repositories/integrations'
import { generateOAuthUrl, exchangeCodeForTokens } from '@/lib/services/integrations'

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const provider = params.provider as integrationsRepo.IntegrationProvider
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')

    if (action === 'connect') {
      // Generate OAuth URL
      const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/${provider}/callback`
      const state = `${tenantId}:${Date.now()}`
      
      try {
        const authUrl = generateOAuthUrl(provider, redirectUri, state)
        return NextResponse.json({ authUrl, state })
      } catch (error: any) {
        console.error('Error generating OAuth URL:', error)
        return NextResponse.json(
          { error: error.message || 'Failed to generate OAuth URL. Please check your environment variables.' },
          { status: 400 }
        )
      }
    }

    if (action === 'status') {
      // Get integration status
      const integration = await integrationsRepo.getIntegrationByProvider(tenantId, provider)
      return NextResponse.json({ integration })
    }

    // Get integration
    const integration = await integrationsRepo.getIntegrationByProvider(tenantId, provider)
    return NextResponse.json({ integration })
  } catch (error) {
    console.error('Error handling integration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const provider = params.provider as integrationsRepo.IntegrationProvider
    await integrationsRepo.deleteIntegration(tenantId, provider)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting integration:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
