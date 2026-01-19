'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Category } from '@/types'

interface SearchResult {
  item_type: Category
  item_id: number
  title: string
  content: string
  tags: string
  updated_at: string
}

export default function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([])
      setShowResults(false)
      return
    }

    const timeoutId = setTimeout(() => {
      setLoading(true)
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => {
          setResults(data.results || [])
          setShowResults(true)
          setLoading(false)
        })
        .catch((err) => {
          console.error('Error searching:', err)
          setLoading(false)
        })
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.item_type]) {
      acc[result.item_type] = []
    }
    acc[result.item_type].push(result)
    return acc
  }, {} as Record<Category, SearchResult[]>)

  return (
    <div className="relative w-full max-w-2xl">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.trim().length > 0 && setShowResults(true)}
        onBlur={() => setTimeout(() => setShowResults(false), 200)}
        placeholder="Search across all databases..."
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {showResults && (loading || results.length > 0) && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No results found</div>
          ) : (
            <div className="py-2">
              {Object.entries(groupedResults).map(([type, items]) => (
                <div key={type} className="mb-4">
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 font-semibold text-sm text-gray-700 dark:text-gray-300 uppercase">
                    {type}
                  </div>
                  {items.map((result) => (
                    <Link
                      key={`${result.item_type}-${result.item_id}`}
                      href={`/${result.item_type}/${result.item_id}`}
                      className="block px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700"
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {result.title}
                      </div>
                      {result.content && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {result.content}
                        </div>
                      )}
                      {result.tags && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {result.tags.split(' ').filter(Boolean).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
