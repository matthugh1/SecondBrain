'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface SavedSearch {
  id: number
  name: string
  query: string
  filters: any
}

export default function SavedSearches() {
  const [searches, setSearches] = useState<SavedSearch[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newSearchName, setNewSearchName] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchSearches()
  }, [])

  const fetchSearches = () => {
    fetch('/api/saved-searches')
      .then((res) => res.json())
      .then((data) => {
        setSearches(data.searches || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching saved searches:', err)
        setLoading(false)
      })
  }

  const saveCurrentSearch = () => {
    const params = new URLSearchParams(window.location.search)
    const query = params.get('q') || ''
    const filters: any = {}
    
    if (params.get('types')) filters.types = params.get('types')?.split(',')
    if (params.get('tags')) filters.tags = params.get('tags')?.split(',')
    if (params.get('dateFrom')) filters.dateFrom = params.get('dateFrom')
    if (params.get('dateTo')) filters.dateTo = params.get('dateTo')
    if (params.get('status')) filters.status = params.get('status')

    fetch('/api/saved-searches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newSearchName,
        query,
        filters,
      }),
    })
      .then(() => {
        setNewSearchName('')
        setShowAdd(false)
        fetchSearches()
      })
      .catch((err) => {
        console.error('Error saving search:', err)
      })
  }

  const deleteSearch = (id: number) => {
    if (!confirm('Delete this saved search?')) return

    fetch(`/api/saved-searches?id=${id}`, {
      method: 'DELETE',
    })
      .then(() => {
        fetchSearches()
      })
      .catch((err) => {
        console.error('Error deleting search:', err)
      })
  }

  const runSearch = (search: SavedSearch) => {
    const params = new URLSearchParams()
    if (search.query) params.append('q', search.query)
    if (search.filters?.types) params.append('types', search.filters.types.join(','))
    if (search.filters?.tags) params.append('tags', search.filters.tags.join(','))
    if (search.filters?.dateFrom) params.append('dateFrom', search.filters.dateFrom)
    if (search.filters?.dateTo) params.append('dateTo', search.filters.dateTo)
    if (search.filters?.status) params.append('status', search.filters.status)

    // Navigate to search results or update current page
    window.location.href = `/?${params.toString()}`
  }

  if (loading) {
    return <div className="text-sm text-gray-500">Loading saved searches...</div>
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Saved Searches
        </h3>
        {!showAdd && (
          <button
            onClick={() => setShowAdd(true)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            + Save Current
          </button>
        )}
      </div>

      {showAdd && (
        <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded">
          <input
            type="text"
            value={newSearchName}
            onChange={(e) => setNewSearchName(e.target.value)}
            placeholder="Search name..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white mb-2"
          />
          <div className="flex gap-2">
            <button
              onClick={saveCurrentSearch}
              disabled={!newSearchName.trim()}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowAdd(false)
                setNewSearchName('')
              }}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {searches.length === 0 ? (
        <div className="text-sm text-gray-500">No saved searches</div>
      ) : (
        <div className="space-y-2">
          {searches.map((search) => (
            <div
              key={search.id}
              className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
            >
              <button
                onClick={() => runSearch(search)}
                className="flex-1 text-left text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              >
                {search.name}
              </button>
              <button
                onClick={() => deleteSearch(search.id)}
                className="text-sm text-red-600 dark:text-red-400 hover:underline ml-2"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
