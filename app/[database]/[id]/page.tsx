'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import FixButton from '@/components/FixButton'
import RichTextEditor from '@/components/RichTextEditor'
import Attachments from '@/components/Attachments'
import Comments from '@/components/Comments'
import InlineEditor from '@/components/InlineEditor'
import Tags from '@/components/Tags'
import RelatedItems from '@/components/RelatedItems'
import { useDataUpdate } from '@/contexts/DataUpdateContext'
import type { Category } from '@/types'

export default function DatabaseItemPage() {
  const params = useParams()
  const router = useRouter()
  const { subscribe, notifyUpdate } = useDataUpdate()
  const database = params.database as string
  const id = params.id as string
  const [item, setItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [logId, setLogId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const fetchItem = () => {
    fetch(`/api/${database}/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setItem(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching item:', err)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchItem()

    // Find the inbox log entry for this item
    fetch(`/api/inbox-log/by-item?database=${database}&itemId=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.id) {
          setLogId(data.id)
        }
      })
      .catch((err) => {
        // Not found is okay - item might have been created manually
        console.log('No inbox log entry found for this item')
      })
  }, [database, id])

  // Subscribe to data updates for this database and 'all'
  useEffect(() => {
    const unsubscribeDatabase = subscribe(database as any, () => {
      fetchItem()
    })
    const unsubscribeAll = subscribe('all', () => {
      fetchItem()
    })

    return () => {
      unsubscribeDatabase()
      unsubscribeAll()
    }
  }, [database, id, subscribe])

  const handleSaveField = async (field: string, value: string) => {
    setSaving(true)
    try {
      const response = await fetch(`/api/${database}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      })
      if (!response.ok) {
        throw new Error('Failed to save')
      }
      fetchItem()
      // Notify other components about the update
      notifyUpdate(database as any)
      notifyUpdate('all')
    } catch (error) {
      console.error('Error saving:', error)
      alert('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const isNotesField = (key: string): boolean => {
    return key === 'notes' || key === 'context' || key === 'follow_ups' || key === 'one_liner'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            404 - Item not found
          </h1>
          <Link
            href={`/${database}`}
            className="mt-4 text-blue-600 hover:text-blue-900 dark:text-blue-400"
          >
            Return to {database}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href={`/${database}`}
            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 mb-4 inline-block"
          >
            ← Back to {database}
          </Link>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {item.name || 'Untitled'}
            </h1>
            {logId && (
              <FixButton
                logId={logId}
                currentCategory={database}
                onFixed={() => {
                  // Refresh the page to show updated data
                  fetchItem()
                  // Notify other components
                  notifyUpdate(database as any)
                  notifyUpdate('all')
                }}
              />
            )}
          </div>

          {/* Tags */}
          <Tags
            itemType={database as Category}
            itemId={item.id}
            onTagsChange={fetchItem}
          />

          {/* Related Items */}
          <RelatedItems
            itemType={database as Category}
            itemId={item.id}
          />
          <dl className="grid grid-cols-1 gap-6">
            {Object.entries(item).map(([key, value]) => {
              if (key === 'id' || key === 'name' || key === 'archived' || key === 'archived_at' || key === 'created_at' || key === 'updated_at' || key === 'created') return null
              
              const isNotes = isNotesField(key)
              
              return (
                <div key={key} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize mb-2">
                    {key.replace(/_/g, ' ')}
                  </dt>
                  <dd className="mt-1">
                    {isNotes ? (
                      <RichTextEditor
                        value={value ? String(value) : ''}
                        onChange={(newValue) => {
                          setItem({ ...item, [key]: newValue })
                        }}
                        onSave={(newValue) => handleSaveField(key, newValue)}
                        placeholder={`Enter ${key.replace(/_/g, ' ')}...`}
                      />
                    ) : (
                      <InlineEditor
                        value={value}
                        onSave={(newValue) => handleSaveField(key, newValue)}
                        type={
                          key === 'status' && database === 'projects'
                            ? 'select'
                            : key === 'status' && database === 'admin'
                            ? 'select'
                            : key === 'due_date' && database === 'admin'
                            ? 'datetime-local'
                            : 'text'
                        }
                        options={
                          key === 'status' && database === 'projects'
                            ? [
                                { value: 'Active', label: 'Active' },
                                { value: 'Waiting', label: 'Waiting' },
                                { value: 'Blocked', label: 'Blocked' },
                                { value: 'Someday', label: 'Someday' },
                                { value: 'Done', label: 'Done' },
                              ]
                            : key === 'status' && database === 'admin'
                            ? [
                                { value: 'Todo', label: 'Todo' },
                                { value: 'Done', label: 'Done' },
                              ]
                            : []
                        }
                        className="text-sm"
                      />
                    )}
                  </dd>
                  <Comments
                    itemType={database}
                    itemId={item.id}
                    fieldKey={key}
                  />
                </div>
              )
            })}
          </dl>

          {/* Item-level Comments */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Comments
              itemType={database}
              itemId={item.id}
            />
          </div>

          {/* Attachments */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Attachments
              itemType={database}
              itemId={item.id}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
