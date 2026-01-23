'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

function PendingSuggestionItem({
  activity,
  onApprove,
  onReject,
}: {
  activity: AgentActivity
  onApprove: () => void
  onReject: () => void
}) {
  const [reasoning, setReasoning] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/agent/suggestions')
      .then(res => res.json())
      .then(data => {
        const suggestion = data.suggestions?.find((s: any) => 
          s.targetType === activity.targetType && 
          s.targetId === activity.targetId
        )
        if (suggestion) setReasoning(suggestion.reasoning)
      })
      .catch(() => {})
  }, [activity.id])

  return (
    <div className="p-4 bg-surfaceElevated border border-warning/20 rounded-xl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="font-bold text-textPrimary">
            {activity.description}
          </p>
          {reasoning && (
            <p className="text-sm text-textMuted mt-1 italic">
              Reasoning: {reasoning}
            </p>
          )}
          {activity.confidence && (
            <p className="text-sm text-textMuted mt-1">
              Confidence: {Math.round(activity.confidence * 100)}%
            </p>
          )}
          {activity.targetId && activity.targetType && (
            <Link
              href={`/${activity.targetType}/${activity.targetId}`}
              className="text-sm text-secondary hover:text-secondary/80 transition-colors mt-1 inline-block font-medium"
            >
              View {activity.targetType} →
            </Link>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={onApprove}
            className="px-3 py-1 text-sm bg-success text-textPrimary font-bold rounded-lg hover:bg-success/90 transition-all shadow-lg shadow-success/20"
          >
            Approve
          </button>
          <button
            onClick={onReject}
            className="px-3 py-1 text-sm bg-error text-textPrimary font-bold rounded-lg hover:bg-error/90 transition-all shadow-lg shadow-error/20"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  )
}

function AgentSettingsEditor({ 
  settings, 
  onSave, 
  onCancel 
}: { 
  settings: AgentSettings
  onSave: (settings: Partial<AgentSettings>) => void
  onCancel: () => void
}) {
  const [proactivityLevel, setProactivityLevel] = useState(settings.proactivityLevel)
  const [approvalThreshold, setApprovalThreshold] = useState(settings.approvalThreshold)
  const [autoApproveTypes, setAutoApproveTypes] = useState<string[]>(settings.autoApproveTypes || [])
  const [focusAreas, setFocusAreas] = useState<string[]>(settings.focusAreas || [])

  const actionTypes = ['create', 'update', 'delete', 'link', 'notify', 'schedule']
  const focusAreaOptions = ['stale_items', 'overdue_tasks', 'unlinked_relationships', 'pattern_anomalies']

  const handleSave = () => {
    onSave({
      proactivityLevel,
      approvalThreshold,
      autoApproveTypes: autoApproveTypes.length > 0 ? autoApproveTypes : undefined,
      focusAreas: focusAreas.length > 0 ? focusAreas : undefined,
    })
  }

  const toggleAutoApproveType = (type: string) => {
    setAutoApproveTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    )
  }

  const toggleFocusArea = (area: string) => {
    setFocusAreas(prev => 
      prev.includes(area)
        ? prev.filter(a => a !== area)
        : [...prev, area]
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-textMuted uppercase tracking-widest mb-1.5 ml-1">
          Proactivity Level
        </label>
        <select
          value={proactivityLevel}
          onChange={(e) => setProactivityLevel(e.target.value)}
          className="w-full px-3 py-2 bg-surface border border-border/60 rounded-lg text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-textMuted uppercase tracking-widest mb-1.5 ml-1">
          Approval Threshold: {Math.round(approvalThreshold * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={approvalThreshold}
          onChange={(e) => setApprovalThreshold(parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-textMuted uppercase tracking-widest mb-2 ml-1">
          Auto-Approve Action Types
        </label>
        <div className="flex flex-wrap gap-2">
          {actionTypes.map(type => (
            <button
              key={type}
              onClick={() => toggleAutoApproveType(type)}
              className={`px-3 py-1 text-sm rounded-lg font-medium transition-all ${
                autoApproveTypes.includes(type)
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
        <label className="block text-xs font-bold text-textMuted uppercase tracking-widest mb-2 ml-1">
          Focus Areas
        </label>
        <div className="flex flex-wrap gap-2">
          {focusAreaOptions.map(area => (
            <button
              key={area}
              onClick={() => toggleFocusArea(area)}
              className={`px-3 py-1 text-sm rounded-lg font-medium transition-all ${
                focusAreas.includes(area)
                  ? 'bg-primary text-textPrimary shadow-lg shadow-primary/20'
                  : 'bg-surface text-textMuted hover:bg-surfaceElevated border border-border/60'
              }`}
            >
              {area.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-primary text-textPrimary font-bold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-surface text-textMuted border border-border/60 rounded-lg hover:bg-surfaceElevated transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

interface AgentActivity {
  id: number
  activityType: string
  actionType?: string
  targetType?: string
  targetId?: number
  description: string
  status: string
  confidence?: number
  createdAt: string
}

interface AgentSettings {
  proactivityLevel: string
  approvalThreshold: number
  autoApproveTypes?: string[]
  focusAreas?: string[]
  notificationPreferences?: Record<string, any>
}

export default function AgentPage() {
  const [activities, setActivities] = useState<AgentActivity[]>([])
  const [allActivities, setAllActivities] = useState<AgentActivity[]>([])
  const [settings, setSettings] = useState<AgentSettings | null>(null)
  const [editingSettings, setEditingSettings] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'suggest' | 'execute' | 'monitor'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')

  useEffect(() => {
    fetchAllActivities()
    fetchSettings()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filter, searchQuery, dateFilter, allActivities])

  const fetchAllActivities = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/agent/activity?limit=1000')
      if (response.ok) {
        const data = await response.json()
        setAllActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...allActivities]

    // Filter by activity type
    if (filter !== 'all') {
      filtered = filtered.filter(a => a.activityType === filter)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(a => 
        a.description.toLowerCase().includes(query) ||
        a.actionType?.toLowerCase().includes(query) ||
        a.targetType?.toLowerCase().includes(query)
      )
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

      filtered = filtered.filter(a => {
        const createdAt = new Date(a.createdAt)
        switch (dateFilter) {
          case 'today':
            return createdAt >= today
          case 'week':
            return createdAt >= weekAgo
          case 'month':
            return createdAt >= monthAgo
          default:
            return true
        }
      })
    }

    setActivities(filtered)
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/agent/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const handleSaveSettings = async (newSettings: Partial<AgentSettings>) => {
    try {
      const response = await fetch('/api/agent/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      })
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
        setEditingSettings(false)
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    }
  }

  const handleExportActivities = () => {
    const csv = [
      ['ID', 'Type', 'Action Type', 'Target Type', 'Target ID', 'Description', 'Status', 'Confidence', 'Created At'].join(','),
      ...activities.map(a => [
        a.id,
        a.activityType,
        a.actionType || '',
        a.targetType || '',
        a.targetId || '',
        `"${a.description.replace(/"/g, '""')}"`,
        a.status,
        a.confidence || '',
        a.createdAt,
      ].join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `agent-activities-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleApprove = async (activityId: number) => {
    try {
      const response = await fetch(`/api/agent/activity/${activityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve: true }),
      })
      if (response.ok) {
        fetchAllActivities()
      }
    } catch (error) {
      console.error('Error approving activity:', error)
    }
  }

  const handleReject = async (activityId: number) => {
    try {
      const response = await fetch(`/api/agent/activity/${activityId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reject: true }),
      })
      if (response.ok) {
        fetchAllActivities()
      }
    } catch (error) {
      console.error('Error rejecting activity:', error)
    }
  }

  const handleRunCycle = async () => {
    try {
      const response = await fetch('/api/agent/run', {
        method: 'POST',
      })
      if (response.ok) {
        const data = await response.json()
        alert(`Agent cycle complete: ${data.suggestions} suggestions, ${data.executed} executed`)
        fetchAllActivities()
      }
    } catch (error) {
      console.error('Error running agent cycle:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning/20 text-warning border border-warning/30'
      case 'approved':
        return 'bg-info/20 text-info border border-info/30'
      case 'executed':
        return 'bg-success/20 text-success border border-success/30'
      case 'rejected':
        return 'bg-error/20 text-error border border-error/30'
      default:
        return 'bg-surface text-textMuted border border-border/60'
    }
  }

  const pendingSuggestions = activities.filter(a => a.activityType === 'suggest' && a.status === 'pending')

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-textMuted font-medium italic">Loading agent activity...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
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
              Autonomous Agent
            </h1>
            <p className="mt-2 text-textMuted font-medium italic">
              Monitor, suggest, and execute actions autonomously
            </p>
          </div>
          <button
            onClick={handleRunCycle}
            className="px-4 py-2 bg-primary text-textPrimary font-bold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Run Agent Cycle
          </button>
        </div>

      {settings && (
        <div className="mb-6 bg-surfaceElevated border border-border/60 rounded-xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-textPrimary">Agent Settings</h2>
            {!editingSettings && (
              <button
                onClick={() => setEditingSettings(true)}
                className="px-3 py-1 text-sm bg-primary text-textPrimary font-bold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Edit
              </button>
            )}
          </div>
          {editingSettings ? (
            <AgentSettingsEditor
              settings={settings}
              onSave={handleSaveSettings}
              onCancel={() => setEditingSettings(false)}
            />
          ) : (
            <div className="text-sm text-textMuted space-y-1">
              <p>Proactivity Level: {settings.proactivityLevel}</p>
              <p>Approval Threshold: {Math.round(settings.approvalThreshold * 100)}%</p>
              {settings.autoApproveTypes && settings.autoApproveTypes.length > 0 && (
                <p>Auto-approve: {settings.autoApproveTypes.join(', ')}</p>
              )}
              {settings.focusAreas && settings.focusAreas.length > 0 && (
                <p>Focus Areas: {settings.focusAreas.join(', ')}</p>
              )}
            </div>
          )}
        </div>
      )}

      {pendingSuggestions.length > 0 && (
        <div className="mb-6 bg-warning/10 border border-warning/20 rounded-xl shadow-xl p-6">
          <h2 className="font-bold text-warning mb-3">
            Pending Suggestions ({pendingSuggestions.length})
          </h2>
          <div className="space-y-3">
            {pendingSuggestions.map((activity) => (
              <PendingSuggestionItem
                key={activity.id}
                activity={activity}
                onApprove={() => handleApprove(activity.id)}
                onReject={() => handleReject(activity.id)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mb-4 space-y-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex gap-2">
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
              onClick={() => setFilter('monitor')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'monitor'
                  ? 'bg-primary text-textPrimary shadow-lg shadow-primary/20'
                  : 'bg-surface text-textMuted hover:bg-surfaceElevated border border-border/60'
              }`}
            >
              Monitor
            </button>
            <button
              onClick={() => setFilter('suggest')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'suggest'
                  ? 'bg-primary text-textPrimary shadow-lg shadow-primary/20'
                  : 'bg-surface text-textMuted hover:bg-surfaceElevated border border-border/60'
              }`}
            >
              Suggestions
            </button>
            <button
              onClick={() => setFilter('execute')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'execute'
                  ? 'bg-primary text-textPrimary shadow-lg shadow-primary/20'
                  : 'bg-surface text-textMuted hover:bg-surfaceElevated border border-border/60'
              }`}
            >
              Executed
            </button>
          </div>
          <div className="flex gap-2">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-3 py-2 bg-surfaceElevated border border-border/60 rounded-lg text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <button
              onClick={handleExportActivities}
              className="px-4 py-2 bg-success text-textPrimary font-bold rounded-lg hover:bg-success/90 transition-all shadow-lg shadow-success/20"
            >
              Export CSV
            </button>
          </div>
        </div>
        <input
          type="text"
          placeholder="Search activities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 bg-surfaceElevated border border-border/60 rounded-lg text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
        />
      </div>

      {activities.length === 0 ? (
        <div className="bg-surfaceElevated border border-border/60 rounded-xl shadow-xl p-20 text-center">
          <div className="w-16 h-16 bg-surface border border-border/60 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-textPrimary mb-2">No Activity</h2>
          <p className="text-textMuted max-w-sm mx-auto">
            No agent activity found. Run an agent cycle to generate suggestions.
          </p>
        </div>
      ) : (
        <div className="bg-surfaceElevated border border-border/60 rounded-xl shadow-xl overflow-hidden">
          <div className="divide-y divide-border/60">
            {activities.map((activity) => (
              <div
                key={activity.id}
                className="p-6 hover:bg-surface/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-textMuted font-medium">{activity.activityType}</span>
                      <span
                        className={`px-2 py-0.5 text-xs font-bold uppercase tracking-widest rounded-lg ${getStatusColor(activity.status)}`}
                      >
                        {activity.status}
                      </span>
                    </div>
                    <p className="font-bold text-textPrimary">
                      {activity.description}
                    </p>
                    <p className="text-sm text-textMuted mt-1">
                      {new Date(activity.createdAt).toLocaleString()}
                    </p>
                    {activity.targetId && activity.targetType && (
                      <Link
                        href={`/${activity.targetType}/${activity.targetId}`}
                        className="text-sm text-secondary hover:text-secondary/80 transition-colors mt-1 inline-block font-medium"
                      >
                        View {activity.targetType} #{activity.targetId} →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
