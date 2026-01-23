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
  priority?: string
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

  const hasActiveFilters = filters.status || filters.priority || filters.tags?.length || filters.dateFrom || filters.dateTo || filters.dueDate || filters.archived

  return (
    <div className="mb-4">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="px-4 py-2 text-sm border border-border/60 rounded-xl bg-surfaceElevated text-textPrimary hover:bg-surface transition-all shadow-lg hover:shadow-primary/10 flex items-center gap-2"
      >
        <svg className={`w-4 h-4 transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        {showFilters ? 'Hide Filters' : 'Show Filters'}
        {hasActiveFilters && (
          <span className="ml-2 px-2 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">
            Active
          </span>
        )}
      </button>

      {showFilters && (
        <div className="mt-4 p-6 border border-border/60 rounded-2xl bg-surface shadow-2xl animate-in fade-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statusOptions.length > 0 && (
              <div>
                <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2 ml-1">
                  Status
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => updateFilter('status', e.target.value || undefined)}
                  className="w-full px-4 py-2.5 bg-surfaceElevated border border-border/60 rounded-xl text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                >
                  <option value="">All Statuses</option>
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {database === 'admin' && (
              <div>
                <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2 ml-1">
                  Priority
                </label>
                <select
                  value={filters.priority || ''}
                  onChange={(e) => updateFilter('priority', e.target.value || undefined)}
                  className="w-full px-4 py-2.5 bg-surfaceElevated border border-border/60 rounded-xl text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                >
                  <option value="">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2 ml-1">
                Date From
              </label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => updateFilter('dateFrom', e.target.value || undefined)}
                className="w-full px-4 py-2.5 bg-surfaceElevated border border-border/60 rounded-xl text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2 ml-1">
                Date To
              </label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => updateFilter('dateTo', e.target.value || undefined)}
                className="w-full px-4 py-2.5 bg-surfaceElevated border border-border/60 rounded-xl text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>

            {database === 'admin' && (
              <div>
                <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2 ml-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={filters.dueDate || ''}
                  onChange={(e) => updateFilter('dueDate', e.target.value || undefined)}
                  className="w-full px-4 py-2.5 bg-surfaceElevated border border-border/60 rounded-xl text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2 ml-1">
                Archived
              </label>
              <select
                value={filters.archived === true ? 'true' : filters.archived === false ? 'false' : ''}
                onChange={(e) => {
                  const val = e.target.value
                  updateFilter('archived', val === '' ? undefined : val === 'true')
                }}
                className="w-full px-4 py-2.5 bg-surfaceElevated border border-border/60 rounded-xl text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              >
                <option value="">Active Only</option>
                <option value="false">Active Only</option>
                <option value="true">Include Archived</option>
              </select>
            </div>
          </div>

          <div className="mt-8">
            <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-3 ml-1">
              Filter by Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.name)}
                  className={`px-4 py-1.5 text-xs rounded-xl border transition-all duration-300 font-bold uppercase tracking-wider ${filters.tags?.includes(tag.name)
                      ? 'bg-primary text-textPrimary border-primary shadow-lg shadow-primary/20'
                      : 'bg-surfaceElevated text-textMuted border-border/60 hover:bg-surfaceElevated/80 hover:text-textPrimary'
                    }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-8 pt-4 border-t border-border/30 flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-xs font-bold text-error uppercase tracking-widest hover:bg-error/10 rounded-xl transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
