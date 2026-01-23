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
    return <div className="text-center py-8 text-textPrimary">Loading...</div>
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === 'all'
              ? 'bg-primary text-textPrimary shadow-lg shadow-primary/20'
              : 'bg-surface text-textMuted hover:bg-surfaceElevated border border-border/60'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('Filed')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === 'Filed'
              ? 'bg-primary text-textPrimary shadow-lg shadow-primary/20'
              : 'bg-surface text-textMuted hover:bg-surfaceElevated border border-border/60'
          }`}
        >
          Filed
        </button>
        <button
          onClick={() => setFilter('Needs Review')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === 'Needs Review'
              ? 'bg-primary text-textPrimary shadow-lg shadow-primary/20'
              : 'bg-surface text-textMuted hover:bg-surfaceElevated border border-border/60'
          }`}
        >
          Needs Review
        </button>
        <button
          onClick={() => setFilter('Fixed')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            filter === 'Fixed'
              ? 'bg-primary text-textPrimary shadow-lg shadow-primary/20'
              : 'bg-surface text-textMuted hover:bg-surfaceElevated border border-border/60'
          }`}
        >
          Fixed
        </button>
        <div className="flex-1" />
        <button
          onClick={handleClearFiled}
          disabled={clearing}
          className={`px-4 py-2 rounded-lg border font-medium transition-all ${
            clearing
              ? 'bg-surfaceElevated text-textMuted border-border/60 cursor-not-allowed opacity-50'
              : 'bg-surface text-textPrimary border-border/60 hover:bg-surfaceElevated'
          }`}
        >
          {clearing ? 'Clearing Filed...' : 'Clear Filed Items'}
        </button>
      </div>

      {clearError && (
        <div className="mb-4 rounded-lg border border-error/30 bg-error/10 px-4 py-2 text-sm text-error">
          {clearError}
        </div>
      )}
      {clearSuccess && (
        <div className="mb-4 rounded-lg border border-success/30 bg-success/10 px-4 py-2 text-sm text-success">
          {clearSuccess}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border/60">
          <thead className="bg-surface border-b border-border/60">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-textMuted uppercase tracking-widest">
                Original Text
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-textMuted uppercase tracking-widest">
                Filed To
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-textMuted uppercase tracking-widest">
                Destination
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-textMuted uppercase tracking-widest">
                Confidence
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-textMuted uppercase tracking-widest">
                Status
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-textMuted uppercase tracking-widest">
                Created
              </th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-textMuted uppercase tracking-widest">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-surfaceElevated divide-y divide-border/60">
            {logs.map((log) => (
              <tr 
                key={log.id} 
                ref={highlightLogId && parseInt(highlightLogId) === log.id ? highlightedRowRef : null}
                className={`hover:bg-surface/80 transition-colors border-b border-border/50 ${
                  highlightLogId && parseInt(highlightLogId) === log.id
                    ? 'bg-highlight/20 ring-2 ring-highlight/50'
                    : ''
                }`}
              >
                <td className="px-6 py-4 text-sm text-textPrimary">
                  {log.original_text}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className="px-2 py-1 text-xs rounded-lg bg-primary/20 text-primary border border-primary/30 font-medium">
                    {log.filed_to}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-textPrimary">
                  {log.destination_url ? (
                    <a
                      href={log.destination_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-secondary hover:text-secondary/80 transition-colors font-medium"
                    >
                      {log.destination_name || 'View'}
                    </a>
                  ) : (
                    <span className="text-textMuted">-</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-textPrimary font-medium">
                  {log.confidence !== null && log.confidence !== undefined
                    ? `${(log.confidence * 100).toFixed(0)}%`
                    : <span className="text-textMuted">-</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span
                    className={`px-2 py-1 text-xs rounded-lg font-medium ${
                      log.status === 'Filed'
                        ? 'bg-success/20 text-success border border-success/30'
                        : log.status === 'Needs Review'
                        ? 'bg-warning/20 text-warning border border-warning/30'
                        : 'bg-surface text-textMuted border border-border/60'
                    }`}
                  >
                    {log.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-textMuted">
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
                      className={`px-3 py-1 text-xs rounded-lg border font-medium transition-all ${
                        deletingId === log.id
                          ? 'bg-surfaceElevated text-textMuted border-border/60 cursor-not-allowed opacity-50'
                          : 'bg-error/10 text-error border-error/30 hover:bg-error/20'
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
