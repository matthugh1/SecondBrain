import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth/config'
import { NextRequest, NextResponse } from 'next/server'
import { authRateLimit } from '@/lib/middleware/rate-limit'

const handler = NextAuth(authOptions)

// Wrap handlers with rate limiting for signin attempts
async function rateLimitedHandler(
  req: NextRequest,
  context: { params: { nextauth: string[] } }
): Promise<NextResponse> {
  // Apply rate limiting to signin endpoint
  // NextAuth uses POST to /api/auth/signin/credentials for credentials signin
  const pathname = req.nextUrl.pathname
  if (pathname.includes('signin') && req.method === 'POST') {
    const rateLimitCheck = await authRateLimit(req)
    if (rateLimitCheck) {
      return rateLimitCheck
    }
  }

  // Call NextAuth handler
  return handler(req, context) as Promise<NextResponse>
}

export { rateLimitedHandler as GET, rateLimitedHandler as POST }
