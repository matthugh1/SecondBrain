'use client'

import { useState } from 'react'
import GlobalSearch from '@/components/GlobalSearch'
import SavedSearches from '@/components/SavedSearches'
import ActionSuggestions from '@/components/ActionSuggestions'
import PatternRecommendations from '@/components/PatternRecommendations'

export default function Home() {
  const [resetting, setResetting] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetSuccess, setResetSuccess] = useState<string | null>(null)

  const handleResetDatabase = async () => {
    const confirmed = window.confirm(
      'Reset the entire database? This will remove all data and cannot be undone.'
    )
    if (!confirmed) return
    setResetting(true)
    setResetError(null)
    setResetSuccess(null)
    try {
      const response = await fetch('/api/reset', { method: 'POST' })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to reset database')
      }
      const data = await response.json().catch(() => ({}))
      setResetSuccess(`Database reset. Removed ${data?.totalRemoved ?? 0} records.`)
      window.dispatchEvent(new Event('stats:refresh'))
    } catch (error) {
      console.error('Error resetting database:', error)
      setResetError('Unable to reset database. Please try again.')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-textPrimary tracking-tight">
            Dashboard
          </h1>
          <p className="mt-2 text-textMuted font-medium italic">
            Your personal knowledge management system
          </p>
        </div>

        {/* Global Search */}
        <div className="mb-10">
          <GlobalSearch />
        </div>

        {/* Saved Searches */}
        <div className="mb-10">
          <SavedSearches />
        </div>

        {/* Action Suggestions */}
        <div className="mb-10">
          <ActionSuggestions />
        </div>

        {/* Pattern Recommendations */}
        <div className="mb-10">
          <PatternRecommendations />
        </div>

        {/* Danger Zone */}
        <div className="mt-20 pt-10 border-t border-border/60">
          <div className="bg-surface/30 rounded-2xl border border-error/20 p-6 backdrop-blur-sm">
            <h3 className="text-sm font-bold text-error uppercase tracking-widest mb-4 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Danger Zone
            </h3>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-textPrimary font-bold text-lg">Reset Database</p>
                <p className="text-textMuted text-sm mt-1">This will permanently delete all your data for testing purposes.</p>
              </div>
              <button
                onClick={handleResetDatabase}
                disabled={resetting}
                className={`px-6 py-2.5 rounded-xl font-bold transition-all ${resetting
                    ? 'bg-surfaceElevated text-textMuted cursor-not-allowed'
                    : 'bg-error text-textPrimary hover:bg-error/90 shadow-lg shadow-error/20'
                  }`}
              >
                {resetting ? 'Resetting...' : 'Factory Reset'}
              </button>
            </div>
            {resetError && (
              <div className="mt-4 p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-medium">
                {resetError}
              </div>
            )}
            {resetSuccess && (
              <div className="mt-4 p-4 rounded-xl bg-success/10 border border-success/20 text-success text-sm font-medium">
                {resetSuccess}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
