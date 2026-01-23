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
import AudioNotes from '@/components/AudioNotes'
import SubTasksSection from '@/components/SubTasksSection'
import DependenciesSection from '@/components/DependenciesSection'
import TimeTracker from '@/components/TimeTracker'
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-textMuted">Loading...</div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-textPrimary">
            404 - Item not found
          </h1>
          <Link
            href={`/${database}`}
            className="mt-4 text-secondary hover:text-secondary/80 transition-colors"
          >
            Return to {database}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href={`/${database}`}
            className="text-xs font-bold text-primary uppercase tracking-widest hover:text-primary/80 transition-colors flex items-center gap-1 group mb-4 inline-block"
          >
            ← Back to {database}
          </Link>
        </div>
        <div className="bg-surfaceElevated border border-border/60 rounded-xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-black text-textPrimary tracking-tight">
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

          {/* Sub-tasks section for admin tasks */}
          {database === 'admin' && (
            <SubTasksSection
              taskId={item.id}
              onUpdate={fetchItem}
            />
          )}

          {/* Dependencies section for admin tasks */}
          {database === 'admin' && (
            <DependenciesSection
              taskId={item.id}
              onUpdate={fetchItem}
            />
          )}

          <dl className="grid grid-cols-1 gap-6">
            {Object.entries(item).map(([key, value]) => {
              if (key === 'id' || key === 'name' || key === 'archived' || key === 'archived_at' || key === 'created_at' || key === 'updated_at' || key === 'created') return null
              
              const isNotes = isNotesField(key)
              
              return (
                <div key={key} className="border-b border-border/60 pb-4">
                  <dt className="text-[10px] font-bold text-textMuted uppercase tracking-widest capitalize mb-2">
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
                        value={value as string | number | null | undefined}
                        onSave={(newValue) => handleSaveField(key, newValue)}
                        type={
                          key === 'status' && database === 'projects'
                            ? 'select'
                            : key === 'status' && database === 'admin'
                            ? 'select'
                            : key === 'priority' && database === 'admin'
                            ? 'select'
                            : (key === 'due_date' || key === 'startDate' || key === 'completedAt') && database === 'admin'
                            ? 'date'
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
                                { value: 'In Progress', label: 'In Progress' },
                                { value: 'Blocked', label: 'Blocked' },
                                { value: 'Waiting', label: 'Waiting' },
                                { value: 'Done', label: 'Done' },
                                { value: 'Cancelled', label: 'Cancelled' },
                              ]
                            : key === 'priority' && database === 'admin'
                            ? [
                                { value: 'low', label: 'Low' },
                                { value: 'medium', label: 'Medium' },
                                { value: 'high', label: 'High' },
                                { value: 'urgent', label: 'Urgent' },
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
          <div className="mt-8 pt-6 border-t border-border/60">
            <Comments
              itemType={database}
              itemId={item.id}
            />
          </div>

          {/* Attachments */}
          <div className="mt-8 pt-6 border-t border-border/60">
            <Attachments
              itemType={database}
              itemId={item.id}
            />
          </div>

          {/* Time Tracker for admin tasks */}
          {database === 'admin' && (
            <div className="mt-8 pt-6 border-t border-border/60">
              <TimeTracker
                taskId={item.id}
                estimatedDuration={item.estimatedDuration}
                actualDuration={item.actualDuration}
                onUpdate={async (estimated, actual) => {
                  await handleSaveField('estimatedDuration', estimated?.toString() || '')
                  if (actual !== undefined) {
                    await handleSaveField('actualDuration', actual.toString())
                  }
                }}
              />
            </div>
          )}

          {/* Audio Notes */}
          <AudioNotes
            itemType={database as Category}
            itemId={item.id}
          />
        </div>
      </div>
    </div>
  )
}
