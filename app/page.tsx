'use client'

import { useState } from 'react'
import Link from 'next/link'
import GlobalSearch from '@/components/GlobalSearch'
import SavedSearches from '@/components/SavedSearches'

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Second Brain Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Your personal knowledge management system
          </p>
        </div>

        {/* Global Search */}
        <div className="mb-8 flex justify-center">
          <GlobalSearch />
        </div>

        {/* Quick Links */}
        <div className="mb-8 flex gap-4 justify-center">
          <Link
            href="/timeline"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            View Timeline
          </Link>
        </div>

        {/* Saved Searches */}
        <div className="mb-8 max-w-2xl mx-auto">
          <SavedSearches />
        </div>
        <div className="mb-8 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleResetDatabase}
              disabled={resetting}
              className={`px-4 py-2 rounded border ${
                resetting
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                  : 'bg-red-600 text-white border-red-700 hover:bg-red-700'
              }`}
            >
              {resetting ? 'Resetting Database...' : 'Reset Database (Testing)'}
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Removes all data from the app.
            </span>
          </div>
          {resetError && (
            <div className="mt-3 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
              {resetError}
            </div>
          )}
          {resetSuccess && (
            <div className="mt-3 rounded border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
              {resetSuccess}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
