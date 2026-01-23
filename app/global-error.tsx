'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { NextResponse } from 'next/server'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to Sentry
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h1>Something went wrong!</h1>
          <p>We've been notified and are working on fixing this issue.</p>
          <button onClick={reset}>Try again</button>
        </div>
      </body>
    </html>
  )
}
