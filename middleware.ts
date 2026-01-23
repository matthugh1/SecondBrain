import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import fs from 'fs'

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: any } }) {
    const pathname = req.nextUrl.pathname
    
    // #region agent log
    try{const logPath='/Users/matthewhughes/Documents/App_Folder/SecondBrain/.cursor/debug.log';const logEntry={location:'middleware.ts:7',message:'Middleware processing request',data:{pathname,method:req.method,url:req.nextUrl.href},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'};fs.appendFileSync(logPath,JSON.stringify(logEntry)+'\n');}catch(e){}
    // #endregion
    
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
      // #region agent log
      try{const logPath='/Users/matthewhughes/Documents/App_Folder/SecondBrain/.cursor/debug.log';const logEntry={location:'middleware.ts:28',message:'Middleware redirecting excluded route',data:{pathname,redirectTo,isSelfRedirect:pathname===redirectTo},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'E'};fs.appendFileSync(logPath,JSON.stringify(logEntry)+'\n');}catch(e){}
      // #endregion
      // Only redirect if it's not already the correct path (avoid self-redirect)
      if (pathname !== redirectTo) {
        return NextResponse.redirect(new URL(redirectTo, req.url))
      }
    }
    
    // #region agent log
    try{const logPath='/Users/matthewhughes/Documents/App_Folder/SecondBrain/.cursor/debug.log';const logEntry={location:'middleware.ts:35',message:'Middleware continuing (not redirecting)',data:{pathname,method:req.method,url:req.nextUrl.href,hasToken:!!req.nextauth?.token},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'E'};fs.appendFileSync(logPath,JSON.stringify(logEntry)+'\n');}catch(e){}
    // #endregion
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const pathname = req.nextUrl.pathname
        
        // #region agent log
        try{const logPath='/Users/matthewhughes/Documents/App_Folder/SecondBrain/.cursor/debug.log';const logEntry={location:'middleware.ts:57',message:'Authorized callback executed',data:{pathname,hasToken:!!token,isAuthRoute:pathname.startsWith('/auth/')},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'E'};fs.appendFileSync(logPath,JSON.stringify(logEntry)+'\n');}catch(e){}
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
