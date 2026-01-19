'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import FixButton from './FixButton'
import { useDataUpdate } from '@/contexts/DataUpdateContext'

interface InboxLog {
  id: number
  original_text: string
  filed_to: string
  destination_name?: string
  destination_url?: string
  confidence?: number
  status: string
  created: string
}

export default function InboxLogView() {
  const searchParams = useSearchParams()
  const { subscribe } = useDataUpdate()
  const highlightLogId = searchParams?.get('highlight')
  const [logs, setLogs] = useState<InboxLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [clearing, setClearing] = useState(false)
  const [clearError, setClearError] = useState<string | null>(null)
  const [clearSuccess, setClearSuccess] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const highlightedRowRef = useRef<HTMLTableRowElement>(null)

  const fetchLogs = () => {
    const url = filter === 'all' ? '/api/inbox-log' : `/api/inbox-log?status=${filter}`
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setLogs(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching inbox log:', err)
        setLoading(false)
      })
  }

  useEffect(() => {
    setLoading(true)
    // If highlighting a specific log, set filter to show all or Needs Review
    if (highlightLogId) {
      setFilter('all') // Show all to ensure the highlighted item is visible
    }
    fetchLogs()
  }, [filter])

  // Subscribe to all data updates
  useEffect(() => {
    const unsubscribeAll = subscribe('all', () => {
      fetchLogs()
    })
    return () => unsubscribeAll()
  }, [subscribe])

  // Scroll to highlighted row after logs are loaded
  useEffect(() => {
    if (highlightLogId && logs.length > 0 && highlightedRowRef.current) {
      setTimeout(() => {
        highlightedRowRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        })
      }, 100)
    }
  }, [logs, highlightLogId])

  const handleClearFiled = async () => {
    const confirmed = window.confirm(
      'Remove all filed items? This is intended for testing and cannot be undone.'
    )
    if (!confirmed) return
    setClearing(true)
    setClearError(null)
    setClearSuccess(null)
    try {
      const response = await fetch('/api/inbox-log/clear-filed', {
        method: 'POST',
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to clear filed items')
      }
      const data = await response.json().catch(() => ({}))
      setClearSuccess(`Removed ${data?.removed ?? 0} filed items.`)
      fetchLogs()
    } catch (error) {
      console.error('Error clearing filed items:', error)
      setClearError('Unable to remove filed items. Please try again.')
    } finally {
      setClearing(false)
    }
  }

  const handleDelete = async (logId: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this inbox log entry? This cannot be undone.'
    )
    if (!confirmed) return
    
    setDeletingId(logId)
    setClearError(null)
    setClearSuccess(null)
    try {
      const response = await fetch(`/api/inbox-log/${logId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to delete entry')
      }
      setClearSuccess('Entry deleted successfully.')
      fetchLogs()
    } catch (error) {
      console.error('Error deleting inbox log entry:', error)
      setClearError('Unable to delete entry. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('Filed')}
          className={`px-4 py-2 rounded ${
            filter === 'Filed'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Filed
        </button>
        <button
          onClick={() => setFilter('Needs Review')}
          className={`px-4 py-2 rounded ${
            filter === 'Needs Review'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Needs Review
        </button>
        <button
          onClick={() => setFilter('Fixed')}
          className={`px-4 py-2 rounded ${
            filter === 'Fixed'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          Fixed
        </button>
        <div className="flex-1" />
        <button
          onClick={handleClearFiled}
          disabled={clearing}
          className={`px-4 py-2 rounded border ${
            clearing
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed'
              : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          {clearing ? 'Clearing Filed...' : 'Clear Filed Items'}
        </button>
      </div>

      {clearError && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {clearError}
        </div>
      )}
      {clearSuccess && (
        <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
          {clearSuccess}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Original Text
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Filed To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Destination
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Confidence
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {logs.map((log) => (
              <tr 
                key={log.id} 
                ref={highlightLogId && parseInt(highlightLogId) === log.id ? highlightedRowRef : null}
                className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  highlightLogId && parseInt(highlightLogId) === log.id
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 ring-2 ring-yellow-400 dark:ring-yellow-600'
                    : ''
                }`}
              >
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  {log.original_text}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  <span className="px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                    {log.filed_to}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                  {log.destination_url ? (
                    <a
                      href={log.destination_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                    >
                      {log.destination_name || 'View'}
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {log.confidence !== null && log.confidence !== undefined
                    ? `${(log.confidence * 100).toFixed(0)}%`
                    : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    className={`px-2 py-1 text-xs rounded ${
                      log.status === 'Filed'
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : log.status === 'Needs Review'
                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {log.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(log.created).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex items-center gap-2">
                    <FixButton
                      logId={log.id}
                      currentCategory={log.filed_to}
                      onFixed={() => {
                        // Refresh the logs
                        fetchLogs()
                      }}
                    />
                    <button
                      onClick={() => handleDelete(log.id)}
                      disabled={deletingId === log.id}
                      className={`px-3 py-1 text-xs rounded border ${
                        deletingId === log.id
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                          : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30'
                      }`}
                      title="Delete this entry"
                    >
                      {deletingId === log.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
