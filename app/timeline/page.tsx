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
            Timeline
          </h1>
          <p className="mt-2 text-textMuted font-medium italic">
            Chronological view of all captures
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-surfaceElevated border border-border/60 rounded-xl shadow-xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-textMuted uppercase tracking-widest mb-2">
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
                    className={`px-3 py-1 text-sm rounded-lg font-medium transition-all ${
                      filters.types.includes(type)
                        ? 'bg-primary text-textPrimary shadow-lg shadow-primary/20'
                        : 'bg-surface text-textMuted hover:bg-surfaceElevated border border-border/60'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-textMuted uppercase tracking-widest mb-2">
                Date Range
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="px-3 py-2 bg-surface border border-border/60 rounded-lg text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="px-3 py-2 bg-surface border border-border/60 rounded-lg text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-textMuted font-medium italic">Loading...</p>
          </div>
        ) : Object.keys(groupedByDate).length === 0 ? (
          <div className="bg-surfaceElevated border border-border/60 rounded-xl shadow-xl p-20 text-center">
            <div className="w-16 h-16 bg-surface border border-border/60 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-textPrimary mb-2">No Items</h2>
            <p className="text-textMuted max-w-sm mx-auto">No items found</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedByDate)
              .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
              .map(([date, dateItems]) => (
                <div key={date}>
                  <h2 className="text-xl font-black text-textPrimary mb-4 tracking-tight">
                    {date}
                  </h2>
                  <div className="space-y-3">
                    {dateItems.map((item) => (
                      <Link
                        key={`${item.item_type}-${item.item_id}`}
                        href={`/${item.item_type}/${item.item_id}`}
                        className="block p-4 bg-surfaceElevated border border-border/60 rounded-xl shadow-xl hover:bg-surface hover:-translate-y-1 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-0.5 text-xs font-bold text-textMuted uppercase tracking-widest bg-surface border border-border/60 rounded-lg capitalize">
                                {item.item_type}
                              </span>
                              <span className="font-bold text-textPrimary">
                                {item.title}
                              </span>
                            </div>
                            {item.content && (
                              <p className="text-sm text-textMuted line-clamp-2 mb-2">
                                {item.content}
                              </p>
                            )}
                            {item.tags && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.tags.split(' ').filter(Boolean).map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 text-xs font-bold bg-primary/20 text-primary border border-primary/30 rounded-lg"
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
