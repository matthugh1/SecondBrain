'use client'

import { useState, useEffect } from 'react'
import type { Category } from '@/types'

interface FilterProps {
  database: Category
  onFiltersChange: (filters: FilterState) => void
  statusOptions?: { value: string; label: string }[]
  initialFilters?: FilterState
}

export interface FilterState {
  status?: string
  tags?: string[]
  dateFrom?: string
  dateTo?: string
  dueDate?: string
  archived?: boolean
}

export default function Filters({ database, onFiltersChange, statusOptions = [], initialFilters }: FilterProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters || {})
  const [availableTags, setAvailableTags] = useState<{ id: number; name: string }[]>([])
  const [showFilters, setShowFilters] = useState(false)
  
  // Update filters when initialFilters prop changes (e.g., from URL params)
  useEffect(() => {
    if (initialFilters) {
      setFilters(initialFilters)
    }
  }, [initialFilters])

  useEffect(() => {
    fetch('/api/tags')
      .then((res) => res.json())
      .then((data) => {
        setAvailableTags(data.tags || [])
      })
      .catch((err) => {
        console.error('Error fetching tags:', err)
      })
  }, [])

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const toggleTag = (tagName: string) => {
    const currentTags = filters.tags || []
    const newTags = currentTags.includes(tagName)
      ? currentTags.filter(t => t !== tagName)
      : [...currentTags, tagName]
    updateFilter('tags', newTags.length > 0 ? newTags : undefined)
  }

  const clearFilters = () => {
    const cleared = {}
    setFilters(cleared)
    onFiltersChange(cleared)
  }

  const hasActiveFilters = filters.status || filters.tags?.length || filters.dateFrom || filters.dateTo || filters.dueDate || filters.archived

  return (
    <div className="mb-4">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
      >
        {showFilters ? 'Hide Filters' : 'Show Filters'}
        {hasActiveFilters && (
          <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
            Active
          </span>
        )}
      </button>

      {showFilters && (
        <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statusOptions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => updateFilter('status', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">All</option>
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date From
              </label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => updateFilter('dateFrom', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date To
              </label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => updateFilter('dateTo', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {database === 'admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={filters.dueDate || ''}
                  onChange={(e) => updateFilter('dueDate', e.target.value || undefined)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Archived
              </label>
              <select
                value={filters.archived === true ? 'true' : filters.archived === false ? 'false' : ''}
                onChange={(e) => {
                  const val = e.target.value
                  updateFilter('archived', val === '' ? undefined : val === 'true')
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Exclude Archived</option>
                <option value="false">Exclude Archived</option>
                <option value="true">Include Archived</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.name)}
                  className={`px-3 py-1 text-sm rounded-lg border ${
                    filters.tags?.includes(tag.name)
                      ? 'bg-blue-500 text-white border-blue-600'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
