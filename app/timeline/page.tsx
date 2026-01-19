'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Category } from '@/types'
import { useDataUpdate } from '@/contexts/DataUpdateContext'

interface TimelineItem {
  item_type: Category
  item_id: number
  title: string
  content: string
  tags: string
  updated_at: string
}

export default function TimelinePage() {
  const { subscribe } = useDataUpdate()
  const [items, setItems] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    types: [] as Category[],
    tags: [] as string[],
    dateFrom: '',
    dateTo: '',
  })

  useEffect(() => {
    fetchTimeline()
  }, [filters])

  // Subscribe to all data updates
  useEffect(() => {
    const unsubscribeAll = subscribe('all', () => {
      fetchTimeline()
    })
    return () => unsubscribeAll()
  }, [subscribe])

  const fetchTimeline = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.types.length > 0) params.append('types', filters.types.join(','))
    if (filters.tags.length > 0) params.append('tags', filters.tags.join(','))
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.append('dateTo', filters.dateTo)

    fetch(`/api/timeline?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setItems(data.results || [])
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching timeline:', err)
        setLoading(false)
      })
  }

  const groupedByDate = items.reduce((acc, item) => {
    const date = item.updated_at ? new Date(item.updated_at).toLocaleDateString() : 'Unknown'
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(item)
    return acc
  }, {} as Record<string, TimelineItem[]>)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Timeline
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Chronological view of all captures
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Types
              </label>
              <div className="flex flex-wrap gap-2">
                {(['people', 'projects', 'ideas', 'admin'] as Category[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      const newTypes = filters.types.includes(type)
                        ? filters.types.filter(t => t !== type)
                        : [...filters.types, type]
                      setFilters({ ...filters, types: newTypes })
                    }}
                    className={`px-3 py-1 text-sm rounded ${
                      filters.types.includes(type)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date Range
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : Object.keys(groupedByDate).length === 0 ? (
          <div className="text-center py-8 text-gray-500">No items found</div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedByDate)
              .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
              .map(([date, dateItems]) => (
                <div key={date}>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    {date}
                  </h2>
                  <div className="space-y-3">
                    {dateItems.map((item) => (
                      <Link
                        key={`${item.item_type}-${item.item_id}`}
                        href={`/${item.item_type}/${item.item_id}`}
                        className="block p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded capitalize">
                                {item.item_type}
                              </span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {item.title}
                              </span>
                            </div>
                            {item.content && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {item.content}
                              </p>
                            )}
                            {item.tags && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.tags.split(' ').filter(Boolean).map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
