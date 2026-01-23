import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: any } }) {
    const pathname = req.nextUrl.pathname
    
    // Redirect excluded routes that have their own pages
    // Also handle common typos
    const excludedRoutes: Record<string, string> = {
      '/calendar': '/calendar',
      '/calandar': '/calendar', // Handle typo: "/calandar" -> "/calendar"
      '/calander': '/calendar', // Handle typo: "/calander" -> "/calendar"
      '/calender': '/calendar', // Handle typo: "/calender" -> "/calendar"
      '/digests': '/digests',
      '/inbox-log': '/inbox-log',
      '/timeline': '/timeline',
      '/settings': '/settings',
      '/rules': '/rules',
    }
    
    // Check if this is an excluded route being accessed via [database] route
    // This shouldn't happen, but if it does, redirect immediately
    if (excludedRoutes[pathname]) {
      const redirectTo = excludedRoutes[pathname]
      // Only redirect if it's not already the correct path (avoid self-redirect)
      if (pathname !== redirectTo) {
        return NextResponse.redirect(new URL(redirectTo, req.url))
      }
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const pathname = req.nextUrl.pathname
        
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
