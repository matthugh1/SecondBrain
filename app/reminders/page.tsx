'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Category } from '@/types'

interface Reminder {
  id: number
  reminderType: string
  itemType: Category
  itemId: number
  title: string
  message: string
  dueDate: string | null
  priority: 'low' | 'medium' | 'high'
  status: string
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'due_date' | 'follow_up' | 'stale_item'>('all')

  useEffect(() => {
    fetchReminders()
  }, [filter])

  const fetchReminders = async () => {
    setLoading(true)
    try {
      const params = filter !== 'all' ? `?type=${filter}` : ''
      const response = await fetch(`/api/reminders${params}`)
      if (response.ok) {
        const data = await response.json()
        setReminders(data.reminders || [])
      }
    } catch (error) {
      console.error('Error fetching reminders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (reminderId: number, status: string, snoozeHours?: number) => {
    try {
      const snoozedUntil = snoozeHours
        ? new Date(Date.now() + snoozeHours * 60 * 60 * 1000).toISOString()
        : undefined

      const response = await fetch(`/api/reminders/${reminderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, snoozedUntil }),
      })

      if (response.ok) {
        fetchReminders()
        window.dispatchEvent(new Event('stats:refresh'))
      }
    } catch (error) {
      console.error('Error updating reminder:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-error/20 text-error border border-error/30'
      case 'medium':
        return 'bg-warning/20 text-warning border border-warning/30'
      case 'low':
        return 'bg-info/20 text-info border border-info/30'
      default:
        return 'bg-surface text-textMuted border border-border/60'
    }
  }

  const getReminderTypeIcon = (type: string) => {
    switch (type) {
      case 'due_date':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      case 'follow_up':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )
      case 'stale_item':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return null
    }
  }

  const getReminderTypeLabel = (type: string) => {
    switch (type) {
      case 'due_date':
        return 'Due Date'
      case 'follow_up':
        return 'Follow-Up'
      case 'stale_item':
        return 'Stale Item'
      default:
        return type
    }
  }

  // Group reminders by type
  const groupedReminders = reminders.reduce((acc, reminder) => {
    if (!acc[reminder.reminderType]) {
      acc[reminder.reminderType] = []
    }
    acc[reminder.reminderType].push(reminder)
    return acc
  }, {} as Record<string, Reminder[]>)

  // Sort reminders by priority (high first) and due date
  Object.keys(groupedReminders).forEach((type) => {
    groupedReminders[type].sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
      if (priorityDiff !== 0) return priorityDiff
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }
      return 0
    })
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-textMuted font-medium italic">Loading reminders...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
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
          <h1 className="text-4xl font-black text-textPrimary tracking-tight mb-2">
            Reminders
          </h1>
          <p className="text-textMuted font-medium italic">
            Stay on top of important items, follow-ups, and deadlines
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-primary text-textPrimary shadow-lg shadow-primary/20'
                : 'bg-surface text-textMuted hover:bg-surfaceElevated border border-border/60'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('due_date')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'due_date'
                ? 'bg-primary text-textPrimary shadow-lg shadow-primary/20'
                : 'bg-surface text-textMuted hover:bg-surfaceElevated border border-border/60'
            }`}
          >
            Due Dates
          </button>
          <button
            onClick={() => setFilter('follow_up')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'follow_up'
                ? 'bg-primary text-textPrimary shadow-lg shadow-primary/20'
                : 'bg-surface text-textMuted hover:bg-surfaceElevated border border-border/60'
            }`}
          >
            Follow-Ups
          </button>
          <button
            onClick={() => setFilter('stale_item')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'stale_item'
                ? 'bg-primary text-textPrimary shadow-lg shadow-primary/20'
                : 'bg-surface text-textMuted hover:bg-surfaceElevated border border-border/60'
            }`}
          >
            Stale Items
          </button>
        </div>

        {/* Reminders Content */}
        {reminders.length === 0 ? (
          <div className="bg-surfaceElevated border border-border/60 rounded-xl shadow-xl p-20 text-center">
            <div className="w-16 h-16 bg-surface border border-border rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-textPrimary mb-2">No Reminders</h2>
            <p className="text-textMuted max-w-sm mx-auto">
              Reminders are generated automatically for due dates, follow-ups, and stale items. Check back later or create items with due dates to see reminders here.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedReminders).map(([type, typeReminders]) => (
              <div key={type} className="bg-surfaceElevated border border-border/60 rounded-xl shadow-xl overflow-hidden">
                {/* Section Header */}
                <div className="bg-surface border-b border-border/60 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="text-primary">
                      {getReminderTypeIcon(type)}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-textPrimary">
                        {getReminderTypeLabel(type)}
                      </h2>
                      <p className="text-xs font-bold text-textMuted uppercase tracking-widest">
                        {typeReminders.length} {typeReminders.length === 1 ? 'reminder' : 'reminders'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reminders List */}
                <div className="divide-y divide-border/60">
                  {typeReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="p-6 hover:bg-surface/50 transition-all duration-300 group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest ${getPriorityColor(reminder.priority)}`}
                            >
                              {reminder.priority}
                            </span>
                            <Link
                              href={`/${reminder.itemType}/${reminder.itemId}`}
                              className="font-bold text-textPrimary hover:text-primary transition-colors truncate"
                            >
                              {reminder.title}
                            </Link>
                          </div>
                          <p className="text-sm text-textMuted mb-3 leading-relaxed">
                            {reminder.message}
                          </p>
                          {reminder.dueDate && (
                            <div className="flex items-center gap-2 text-xs text-textMuted">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="font-medium">
                                Due: {new Date(reminder.dueDate).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleStatusChange(reminder.id, 'snoozed', 24)}
                            className="px-4 py-2 text-xs font-bold text-textMuted uppercase tracking-widest bg-surface hover:bg-surfaceElevated border border-border/60 rounded-lg transition-all hover:text-textPrimary"
                            title="Snooze for 24 hours"
                          >
                            Snooze
                          </button>
                          <button
                            onClick={() => handleStatusChange(reminder.id, 'completed')}
                            className="px-4 py-2 text-xs font-bold text-textPrimary uppercase tracking-widest bg-success/20 hover:bg-success/30 text-success border border-success/30 rounded-lg transition-all shadow-lg shadow-success/10"
                            title="Mark as completed"
                          >
                            Done
                          </button>
                          <button
                            onClick={() => handleStatusChange(reminder.id, 'dismissed')}
                            className="px-4 py-2 text-xs font-bold text-textMuted uppercase tracking-widest bg-surface hover:bg-error/10 border border-border/60 hover:border-error/20 rounded-lg transition-all hover:text-error"
                            title="Dismiss reminder"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
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
