export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime initialization
    const { init } = await import('./sentry.edge.config')
    init()
  } else {
    // Node.js runtime initialization
    const { init } = await import('./sentry.server.config')
    init()
  }
}
