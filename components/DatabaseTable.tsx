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
    return <div className="text-center py-8">Loading...</div>
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
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
    <div>
      <Filters
        database={database as any}
        onFiltersChange={setFilters}
        statusOptions={statusOptions}
        initialFilters={filters}
      />
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedIds.length === data.length && data.length > 0}
                  onChange={handleSelectAll}
                  className="rounded"
                />
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                    className="rounded"
                  />
                </td>
                {columns.map((col) => {
                const isEditable = col.editable !== false && col.key !== 'id' && col.key !== 'created_at' && col.key !== 'updated_at'
                const displayValue = getDisplayValue(item, col.key)
                
                return (
                  <td
                    key={col.key}
                    className={`px-6 py-4 text-sm text-gray-900 dark:text-gray-100 ${col.type === 'textarea' ? '' : 'whitespace-nowrap'}`}
                  >
                    {isEditable ? (
                      <InlineEditor
                        value={item[col.key]}
                        onSave={(value) => handleSave(item.id, col.key, value)}
                        type={col.type || 'text'}
                        options={col.options}
                        className="min-w-[100px]"
                      />
                    ) : (
                      displayValue
                    )}
                  </td>
                )
              })}
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/${database}/${item.id}`}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(item.id, item.name || `Item ${item.id}`)}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 transition"
                  >
                    Delete
                  </button>
                  {item.logId && (
                    <FixButton
                      logId={item.logId}
                      currentCategory={database}
                      onFixed={() => {
                        // Refresh the table after fixing
                        fetchData()
                        // Notify other components
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
  )
}
