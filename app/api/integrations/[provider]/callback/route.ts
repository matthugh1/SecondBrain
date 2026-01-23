import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as integrationsRepo from '@/lib/db/repositories/integrations'
import { exchangeCodeForTokens } from '@/lib/services/integrations'

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
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/integrations?error=${encodeURIComponent(error)}`
      )
    }

    if (!code) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/integrations?error=no_code`
      )
    }

    // Exchange code for tokens
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/${provider}/callback`
    const tokens = await exchangeCodeForTokens(provider, code, redirectUri)

    // Store integration
    await integrationsRepo.upsertIntegration(tenantId, provider, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : undefined,
      ...tokens,
    }, 'active')

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/integrations?success=true&provider=${provider}`
    )
  } catch (error: any) {
    console.error('Error in OAuth callback:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/integrations?error=${encodeURIComponent(error.message)}`
    )
  }
}
