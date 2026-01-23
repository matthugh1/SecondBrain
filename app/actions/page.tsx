'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Action {
  id: number
  actionType: string
  targetType?: string
  targetId?: number
  parameters: Record<string, any>
  status: string
  requiresApproval: boolean
  approvedBy?: string
  approvedAt?: string
  executedAt?: string
  result?: Record<string, any>
  errorMessage?: string
  createdAt: string
}

export default function ActionsPage() {
  const [actions, setActions] = useState<Action[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'executed' | 'failed'>('all')

  useEffect(() => {
    fetchActions()
  }, [filter])

  const fetchActions = async () => {
    setLoading(true)
    try {
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const response = await fetch(`/api/actions${params}`)
      if (response.ok) {
        const data = await response.json()
        setActions(data.actions || [])
      }
    } catch (error) {
      console.error('Error fetching actions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (actionId: number) => {
    try {
      const response = await fetch(`/api/actions/${actionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approve: true, execute: true }),
      })
      if (response.ok) {
        fetchActions()
      }
    } catch (error) {
      console.error('Error approving action:', error)
    }
  }

  const handleReject = async (actionId: number, reason?: string) => {
    try {
      const response = await fetch(`/api/actions/${actionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reject: true, reason }),
      })
      if (response.ok) {
        fetchActions()
      }
    } catch (error) {
      console.error('Error rejecting action:', error)
    }
  }

  const handleRollback = async (actionId: number) => {
    if (!confirm('Are you sure you want to rollback this action?')) {
      return
    }

    try {
      const response = await fetch(`/api/actions/${actionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollback: true }),
      })
      if (response.ok) {
        fetchActions()
      }
    } catch (error) {
      console.error('Error rolling back action:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-warning/20 text-warning border border-warning/30'
      case 'approved':
        return 'bg-info/20 text-info border border-info/30'
      case 'executing':
        return 'bg-primary/20 text-primary border border-primary/30'
      case 'executed':
        return 'bg-success/20 text-success border border-success/30'
      case 'rejected':
        return 'bg-error/20 text-error border border-error/30'
      case 'failed':
        return 'bg-error/20 text-error border border-error/30'
      default:
        return 'bg-surface text-textMuted border border-border/60'
    }
  }

  const getActionDescription = (action: Action) => {
    const { actionType, targetType, targetId, parameters } = action
    switch (actionType) {
      case 'create':
        return `Create new ${targetType || 'item'}${parameters.name ? `: ${parameters.name}` : ''}`
      case 'update':
        return `Update ${targetType || 'item'}${targetId ? ` #${targetId}` : ''}`
      case 'delete':
        return `Delete ${targetType || 'item'}${targetId ? ` #${targetId}` : ''}`
      case 'link':
        return `Link ${parameters.sourceType || 'item'} to ${parameters.targetType || 'item'}`
      case 'notify':
        return `Send notification: ${parameters.title || 'Notification'}`
      case 'schedule':
        return `Schedule reminder: ${parameters.title || 'Reminder'}`
      default:
        return `${actionType} ${targetType || ''}`
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-textMuted font-medium italic">Loading actions...</p>
          </div>
        </div>
      </div>
    )
  }

  const pendingActions = actions.filter(a => a.status === 'pending' && a.requiresApproval)

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
            Actions
          </h1>
          <p className="mt-2 text-textMuted font-medium italic">
            Manage and approve system actions
          </p>
        </div>

        {pendingActions.length > 0 && (
          <div className="mb-6 bg-warning/10 border border-warning/20 rounded-xl shadow-xl p-6">
            <h2 className="font-bold text-warning mb-3">
              Pending Approval ({pendingActions.length})
            </h2>
            <div className="space-y-3">
              {pendingActions.map((action) => (
                <div
                  key={action.id}
                  className="p-4 bg-surfaceElevated border border-warning/20 rounded-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-bold text-textPrimary">
                        {getActionDescription(action)}
                      </p>
                      <p className="text-sm text-textMuted mt-1">
                        {new Date(action.createdAt).toLocaleString()}
                      </p>
                      {action.parameters && Object.keys(action.parameters).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-sm text-textMuted cursor-pointer hover:text-textPrimary transition-colors">View details</summary>
                          <pre className="mt-2 text-xs bg-background border border-border/60 p-2 rounded-lg overflow-auto text-textMuted">
                            {JSON.stringify(action.parameters, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleApprove(action.id)}
                        className="px-3 py-1 text-sm bg-success text-textPrimary font-bold rounded-lg hover:bg-success/90 transition-all shadow-lg shadow-success/20"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(action.id)}
                        className="px-3 py-1 text-sm bg-error text-textPrimary font-bold rounded-lg hover:bg-error/90 transition-all shadow-lg shadow-error/20"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'pending'
                ? 'bg-primary text-textPrimary shadow-lg shadow-primary/20'
                : 'bg-surface text-textMuted hover:bg-surfaceElevated border border-border/60'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('executed')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'executed'
                ? 'bg-primary text-textPrimary shadow-lg shadow-primary/20'
                : 'bg-surface text-textMuted hover:bg-surfaceElevated border border-border/60'
            }`}
          >
            Executed
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'failed'
                ? 'bg-primary text-textPrimary shadow-lg shadow-primary/20'
                : 'bg-surface text-textMuted hover:bg-surfaceElevated border border-border/60'
            }`}
          >
            Failed
          </button>
        </div>

        {actions.length === 0 ? (
          <div className="bg-surfaceElevated border border-border/60 rounded-xl shadow-xl p-20 text-center">
            <div className="w-16 h-16 bg-surface border border-border/60 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-textPrimary mb-2">No Actions</h2>
            <p className="text-textMuted max-w-sm mx-auto">
              No actions found.
            </p>
          </div>
        ) : (
          <div className="bg-surfaceElevated border border-border/60 rounded-xl shadow-xl overflow-hidden">
            <div className="divide-y divide-border/60">
              {actions.map((action) => (
                <div
                  key={action.id}
                  className="p-6 hover:bg-surface/50 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-0.5 text-xs font-bold uppercase tracking-widest rounded-lg ${getStatusColor(action.status)}`}
                        >
                          {action.status}
                        </span>
                        <span className="text-xs text-textMuted font-medium">{action.actionType}</span>
                      </div>
                      <p className="font-bold text-textPrimary">
                        {getActionDescription(action)}
                      </p>
                      <p className="text-sm text-textMuted mt-1">
                        {new Date(action.createdAt).toLocaleString()}
                      </p>
                      {action.errorMessage && (
                        <p className="text-sm text-error mt-1 font-medium">
                          Error: {action.errorMessage}
                        </p>
                      )}
                      {action.targetId && action.targetType && (
                        <Link
                          href={`/${action.targetType}/${action.targetId}`}
                          className="text-sm text-secondary hover:text-secondary/80 transition-colors mt-1 inline-block font-medium"
                        >
                          View {action.targetType} #{action.targetId} →
                        </Link>
                      )}
                    </div>
                    {action.status === 'executed' && (
                      <button
                        onClick={() => handleRollback(action.id)}
                        className="px-3 py-1 text-sm bg-surface text-textMuted border border-border/60 rounded-lg hover:bg-surfaceElevated hover:text-textPrimary transition-all font-medium"
                      >
                        Rollback
                      </button>
                    )}
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
