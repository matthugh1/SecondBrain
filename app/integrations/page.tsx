'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Integration {
  id: number
  provider: string
  status: string
  lastSync?: string
  lastError?: string
  errorCount: number
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const searchParams = useSearchParams()

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/integrations')
      if (response.ok) {
        const data = await response.json()
        setIntegrations(data.integrations || [])
      }
    } catch (error) {
      console.error('Error fetching integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (provider: string) => {
    try {
      const response = await fetch(`/api/integrations/${provider}?action=connect`)
      const data = await response.json()
      
      if (response.ok) {
        window.location.href = data.authUrl
      } else {
        // Display error message
        const errorMessage = data.error || 'Failed to connect integration'
        window.location.href = `/integrations?error=${encodeURIComponent(errorMessage)}`
      }
    } catch (error: any) {
      console.error('Error connecting integration:', error)
      window.location.href = `/integrations?error=${encodeURIComponent(error.message || 'Failed to connect integration')}`
    }
  }

  const handleDisconnect = async (provider: string) => {
    if (!confirm(`Are you sure you want to disconnect ${provider}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/integrations/${provider}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        fetchIntegrations()
      }
    } catch (error) {
      console.error('Error disconnecting integration:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success/20 text-success border border-success/30'
      case 'error':
        return 'bg-error/20 text-error border border-error/30'
      case 'disconnected':
        return 'bg-surface text-textMuted border border-border/60'
      default:
        return 'bg-surface text-textMuted border border-border/60'
    }
  }

  const availableProviders: Array<{
    id: string
    name: string
    description: string
    setupRequired?: boolean
    setupNote?: string
  }> = [
    { 
      id: 'gmail', 
      name: 'Gmail', 
      description: 'Capture emails and create tasks',
    },
    { 
      id: 'google_calendar', 
      name: 'Google Calendar', 
      description: 'Sync events and tasks',
    },
    { 
      id: 'slack', 
      name: 'Slack', 
      description: 'Capture messages and post updates',
    },
    { 
      id: 'notion', 
      name: 'Notion', 
      description: 'Sync databases and pages',
    },
    { 
      id: 'outlook', 
      name: 'Outlook', 
      description: 'Capture emails from Outlook',
      setupRequired: true,
      setupNote: 'Requires one-time Azure app registration (5 min setup, no admin needed for personal accounts)'
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-textMuted font-medium italic">Loading integrations...</p>
          </div>
        </div>
      </div>
    )
  }

  const connectedProviders = integrations.map(i => i.provider)
  const success = searchParams?.get('success')
  const error = searchParams?.get('error')

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <nav className="mb-4">
            <Link
              href="/"
              className="text-xs font-bold text-primary uppercase tracking-widest hover:text-primary/80 transition-colors flex items-center gap-1 group"
            >
              <svg className="w-3 h-3 transform group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </Link>
          </nav>
          <h1 className="text-4xl font-black text-textPrimary tracking-tight">
            Integrations
          </h1>
          <p className="mt-2 text-textMuted font-medium italic">
            Connect external services to enhance your Second Brain
          </p>
        </div>

        {success && (
          <div className="mb-4 p-4 bg-success/10 border border-success/20 rounded-lg">
            <p className="text-success font-medium">
              Successfully connected {searchParams?.get('provider')}!
            </p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-error/10 border border-error/20 rounded-lg">
            <p className="text-error font-medium mb-2">
              Error: {error}
            </p>
            {error.includes('MICROSOFT_CLIENT_ID') && (
              <div className="mt-3 p-3 bg-surface rounded-lg border border-border/60">
                <p className="text-sm text-textPrimary font-medium mb-2">
                  📋 Quick Setup Guide:
                </p>
                <p className="text-sm text-textMuted mb-2">
                  <strong>Good news:</strong> If you have a personal Microsoft account (not a work/school account), 
                  you can set this up yourself in about 5 minutes - no admin needed!
                </p>
                <ol className="text-sm text-textMuted list-decimal list-inside space-y-1 ml-2">
                  <li>Go to <a href="https://portal.azure.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">portal.azure.com</a> and sign in</li>
                  <li>Search for "Azure Active Directory" → "App registrations"</li>
                  <li>Click "New registration"</li>
                  <li>Name it "SecondBrain" and add redirect URI: <code className="bg-surfaceElevated px-1 rounded text-xs">{process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/integrations/outlook/callback</code></li>
                  <li>Copy the "Application (client) ID"</li>
                  <li>Go to "Certificates & secrets" → Create a new client secret</li>
                  <li>Add both to your <code className="bg-surfaceElevated px-1 rounded text-xs">.env.local</code> file</li>
                  <li>Restart your dev server</li>
                </ol>
                <p className="text-xs text-textMuted mt-2 italic">
                  Note: If you're using a work/school account, you may need your IT admin to approve the app registration.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableProviders.map((provider) => {
            const integration = integrations.find(i => i.provider === provider.id)
            const isConnected = connectedProviders.includes(provider.id)

            return (
              <div
                key={provider.id}
                className="bg-surfaceElevated border border-border/60 rounded-xl shadow-xl p-6 hover:bg-surface hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-textPrimary">
                      {provider.name}
                    </h3>
                    <p className="text-sm text-textMuted">
                      {provider.description}
                    </p>
                    {provider.setupRequired && !isConnected && (
                      <p className="text-xs text-textMuted mt-1 italic">
                        {provider.setupNote}
                      </p>
                    )}
                  </div>
                  {isConnected && (
                    <span
                      className={`px-2 py-0.5 text-xs font-bold uppercase tracking-widest rounded-lg ${getStatusColor(integration?.status || 'disconnected')}`}
                    >
                      {integration?.status || 'disconnected'}
                    </span>
                  )}
                </div>

                {isConnected && integration && (
                  <div className="text-sm text-textMuted mb-3 space-y-1">
                    {integration.lastSync && (
                      <p>Last sync: {new Date(integration.lastSync).toLocaleString()}</p>
                    )}
                    {integration.errorCount > 0 && (
                      <p className="text-error font-medium">
                        {integration.errorCount} error{integration.errorCount !== 1 ? 's' : ''}
                      </p>
                    )}
                    {integration.lastError && (
                      <p className="text-xs text-error">
                        {integration.lastError}
                      </p>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  {isConnected ? (
                    <button
                      onClick={() => handleDisconnect(provider.id)}
                      className="px-4 py-2 bg-error text-textPrimary font-bold rounded-lg hover:bg-error/90 transition-all shadow-lg shadow-error/20 text-sm"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(provider.id)}
                      className="px-4 py-2 bg-primary text-textPrimary font-bold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 text-sm"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
