'use client'

import { useState } from 'react'

interface BulkActionsProps {
  selectedIds: number[]
  database: string
  onActionComplete: () => void
  statusOptions?: { value: string; label: string }[]
}

export default function BulkActions({
  selectedIds,
  database,
  onActionComplete,
  statusOptions = [],
}: BulkActionsProps) {
  const [action, setAction] = useState<string>('')
  const [statusValue, setStatusValue] = useState('')
  const [tagValue, setTagValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleBulkAction = async () => {
    if (!action) return

    if (action === 'update_status' && !statusValue) {
      setError('Please select a status')
      return
    }

    if (action === 'update_tags' && !tagValue.trim()) {
      setError('Please enter tags')
      return
    }

    setLoading(true)
    setError(null)

    try {
      let requestBody: any = {
        action: '',
        ids: selectedIds,
      }

      switch (action) {
        case 'delete':
          if (!confirm(`Delete ${selectedIds.length} item(s)?`)) {
            setLoading(false)
            return
          }
          requestBody.action = 'delete'
          break
        case 'archive':
          requestBody.action = 'archive'
          break
        case 'unarchive':
          requestBody.action = 'unarchive'
          break
        case 'update_status':
          requestBody.action = 'update'
          requestBody.data = { status: statusValue }
          break
        case 'update_tags':
          requestBody.action = 'update'
          requestBody.data = { tags: tagValue }
          break
      }

      const response = await fetch(`/api/${database}/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Bulk operation failed')
      }

      const result = await response.json()
      if (result.failed > 0) {
        setError(`${result.success} succeeded, ${result.failed} failed`)
      }

      setAction('')
      setStatusValue('')
      setTagValue('')
      onActionComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  if (selectedIds.length === 0) return null

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 z-50 min-w-[400px]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {selectedIds.length} item(s) selected
        </span>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Select action...</option>
          <option value="delete">Delete</option>
          <option value="archive">Archive</option>
          <option value="unarchive">Unarchive</option>
          {statusOptions.length > 0 && (
            <option value="update_status">Update Status</option>
          )}
          <option value="update_tags">Update Tags</option>
        </select>
      </div>

      {action === 'update_status' && statusOptions.length > 0 && (
        <div className="mb-3">
          <select
            value={statusValue}
            onChange={(e) => setStatusValue(e.target.value)}
            className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Select status...</option>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {action === 'update_tags' && (
        <div className="mb-3">
          <input
            type="text"
            value={tagValue}
            onChange={(e) => setTagValue(e.target.value)}
            placeholder="Enter tags (comma-separated)"
            className="w-full px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      )}

      {error && (
        <div className="mb-3 p-2 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200 rounded text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleBulkAction}
          disabled={!action || loading || (action === 'update_status' && !statusValue) || (action === 'update_tags' && !tagValue.trim())}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Apply'}
        </button>
        <button
          onClick={() => {
            setAction('')
            setStatusValue('')
            setTagValue('')
            setError(null)
            onActionComplete()
          }}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
