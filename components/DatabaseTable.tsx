'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import FixButton from './FixButton'
import InlineEditor from './InlineEditor'
import BulkActions from './BulkActions'
import Filters, { FilterState } from './Filters'
import { useDataUpdate } from '@/contexts/DataUpdateContext'

interface DatabaseTableProps {
  database: string
  columns: { key: string; label: string; editable?: boolean; type?: 'text' | 'textarea' | 'select' | 'date' | 'datetime-local'; options?: { value: string; label: string }[] }[]
  getDisplayValue: (item: any, key: string) => string | React.ReactNode
  statusOptions?: { value: string; label: string }[]
}

export default function DatabaseTable({
  database,
  columns,
  getDisplayValue,
  statusOptions = [],
}: DatabaseTableProps) {
  const { subscribe, notifyUpdate } = useDataUpdate()
  const searchParams = useSearchParams()

  // Initialize filters from URL parameters immediately
  const initialDueDate = searchParams?.get('dueDate')
  const initialFilters: FilterState = {}
  if (initialDueDate && database === 'admin') {
    initialFilters.dueDate = initialDueDate
  }

  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [filters, setFilters] = useState<FilterState>(initialFilters)

  // Update filters when URL parameters change
  useEffect(() => {
    const dueDate = searchParams?.get('dueDate')
    if (database === 'admin') {
      if (dueDate) {
        setFilters(prev => ({ ...prev, dueDate }))
      } else {
        // Remove dueDate filter if it's not in URL
        setFilters(prev => {
          const { dueDate: _, ...rest } = prev
          return rest
        })
      }
    }
  }, [searchParams, database])

  const fetchData = () => {
    const params = new URLSearchParams()
    if (filters.status) params.append('status', filters.status)
    if (filters.tags?.length) params.append('tags', filters.tags.join(','))
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
    if (filters.dateTo) params.append('dateTo', filters.dateTo)
    if (filters.dueDate) params.append('dueDate', filters.dueDate)
    if (filters.archived !== undefined) params.append('archived', filters.archived.toString())

    const url = `/api/${database}${params.toString() ? '?' + params.toString() : ''}`
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching data:', err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchData()
  }, [database, filters])

  // Subscribe to data updates for this database and 'all'
  useEffect(() => {
    const unsubscribeDatabase = subscribe(database as any, () => {
      fetchData()
    })
    const unsubscribeAll = subscribe('all', () => {
      fetchData()
    })

    return () => {
      unsubscribeDatabase()
      unsubscribeAll()
    }
  }, [database, subscribe])

  const handleSave = async (itemId: number, field: string, value: string) => {
    try {
      const response = await fetch(`/api/${database}/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (!response.ok) {
        throw new Error('Failed to save')
      }
      // Refresh data
      fetchData()
      // Notify other components about the update
      notifyUpdate(database as any)
      notifyUpdate('all')
    } catch (error) {
      console.error('Error saving:', error)
      throw error
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-textPrimary">Loading...</div>
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-textMuted">
        No items found. Start capturing thoughts using the chat interface!
      </div>
    )
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(data.map(item => item.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectItem = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id])
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id))
    }
  }

  const handleDelete = async (itemId: number, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/${database}/${itemId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete item')
      }

      // Refresh data
      fetchData()
      // Notify other components about the update
      notifyUpdate(database as any)
      notifyUpdate('all')
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item. Please try again.')
    }
  }

  return (
    <div className="bg-surfaceElevated rounded-xl border border-border/60 overflow-hidden shadow-xl">
      <div className="p-4 bg-surfaceElevated/80 backdrop-blur-sm border-b border-border/60">
        <Filters
          database={database as any}
          onFiltersChange={setFilters}
          statusOptions={statusOptions}
          initialFilters={filters}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border/60">
          <thead className="bg-surface border-b border-border/60">
            <tr>
              <th className="px-6 py-4 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.length === data.length && data.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-border/60 bg-surfaceElevated text-primary focus:ring-primary/50"
                />
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-4 text-left text-[10px] font-bold text-textMuted uppercase tracking-widest"
                >
                  {col.label}
                </th>
              ))}
              <th className="px-6 py-4 text-left text-[10px] font-bold text-textMuted uppercase tracking-widest">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 bg-surface">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-surfaceElevated/80 transition-colors group border-b border-border/50">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                    className="rounded border-border/60 bg-surfaceElevated text-primary focus:ring-primary/50"
                  />
                </td>
                {columns.map((col) => {
                  const isEditable = col.editable !== false && col.key !== 'id' && col.key !== 'created_at' && col.key !== 'updated_at'
                  const displayValue = getDisplayValue(item, col.key)

                  return (
                    <td
                      key={col.key}
                      className={`px-6 py-4 text-sm text-textPrimary ${col.type === 'textarea' ? '' : 'whitespace-nowrap'}`}
                    >
                      {isEditable ? (
                        <InlineEditor
                          value={item[col.key]}
                          onSave={(value) => handleSave(item.id, col.key, value)}
                          type={col.type || 'text'}
                          options={col.options}
                          className="min-w-[100px] bg-transparent hover:bg-surface border-transparent"
                        />
                      ) : (
                        displayValue
                      )}
                    </td>
                  )
                })}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/${database}/${item.id}`}
                      className="p-2 text-secondary hover:bg-secondary/20 hover:text-secondary rounded-lg transition-all border border-transparent hover:border-secondary/30"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </Link>
                    <button
                      onClick={() => handleDelete(item.id, item.name || `Item ${item.id}`)}
                      className="p-2 text-error hover:bg-error/20 hover:text-error rounded-lg transition-all border border-transparent hover:border-error/30"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    {item.logId && (
                      <FixButton
                        logId={item.logId}
                        currentCategory={database}
                        onFixed={() => {
                          fetchData()
                          notifyUpdate(database as any)
                          notifyUpdate('all')
                        }}
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 bg-surfaceElevated/80 backdrop-blur-sm border-t border-border/60">
        <BulkActions
          selectedIds={selectedIds}
          database={database}
          onActionComplete={() => {
            setSelectedIds([])
            fetchData()
          }}
          statusOptions={statusOptions}
        />
      </div>
    </div>
  )
}
