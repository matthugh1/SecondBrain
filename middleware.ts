import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: any } }) {
    const pathname = req.nextUrl.pathname
    
    // #region agent log
    const logData = {
      location: 'middleware.ts:middleware',
      message: 'Middleware executed',
      data: {
        pathname,
        method: req.method,
        url: req.nextUrl.href,
        hasToken: !!req.nextauth?.token,
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'C',
    }
    console.log('[DEBUG]', JSON.stringify(logData))
    // #endregion
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const pathname = req.nextUrl.pathname
        
        // #region agent log
        const logData = {
          location: 'middleware.ts:authorized',
          message: 'Authorized callback executed',
          data: {
            pathname,
            hasToken: !!token,
            isAuthRoute: pathname.startsWith('/auth/'),
          },
          timestamp: Date.now(),
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'C',
        }
        console.log('[DEBUG]', JSON.stringify(logData))
        // #endregion
        
        // CRITICAL: Always allow auth routes (signin, register, etc.) - return true to bypass auth
        if (pathname.startsWith('/auth/')) {
          return true
        }
        
        // Allow static files and Next.js internals
        if (
          pathname.startsWith('/_next/') ||
          pathname.startsWith('/api/auth/') ||
          /\.(.*)$/.test(pathname)
        ) {
          return true
        }
        
        // Allow intent detection API (needs auth but handled in route)
        if (pathname.startsWith('/api/intent/')) {
          return !!token  // Require auth but don't redirect
        }
        
        // Require authentication for protected routes
        return !!token
      },
    },
    pages: {
      signIn: '/auth/signin',
    },
  }
)

export const config = {
  matcher: [
    // Use negative lookahead to EXCLUDE auth routes explicitly
    '/((?!auth|_next/static|_next/image|favicon.ico).*)',
  ],
}
