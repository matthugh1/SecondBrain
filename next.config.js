/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Enable instrumentation hook
  experimental: {
    instrumentationHook: true,
  },
}

// Only wrap with Sentry if DSN is configured
if (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN) {
  const { withSentryConfig } = require('@sentry/nextjs')
  
  nextConfig.sentry = {
    // Hide source maps from client
    hideSourceMaps: true,
    
    // Automatically instrument API routes
    tunnelRoute: '/api/sentry-tunnel',
    
    // Disable Sentry in development (optional)
    disableServerWebpackPlugin: process.env.NODE_ENV === 'development' && !process.env.ENABLE_SENTRY,
    disableClientWebpackPlugin: process.env.NODE_ENV === 'development' && !process.env.ENABLE_SENTRY,
  }

  // Wrap with Sentry config
  module.exports = withSentryConfig(
    nextConfig,
    {
      // Suppresses source map uploading logs during build
      silent: true,
      
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      
      // Only upload source maps in production
      widenClientFileUpload: true,
      hideSourceMaps: true,
      disableLogger: true,
    }
  )
} else {
  module.exports = nextConfig
}
