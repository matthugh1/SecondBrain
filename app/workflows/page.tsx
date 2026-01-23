'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Workflow {
  id: number
  name: string
  description?: string
  trigger: any
  actions: any[]
  priority: number
  enabled: boolean
  executionCount: number
  lastExecutedAt?: string
}

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    fetchWorkflows()
  }, [])

  const fetchWorkflows = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/workflows')
      if (response.ok) {
        const data = await response.json()
        setWorkflows(data.workflows || [])
      }
    } catch (error) {
      console.error('Error fetching workflows:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleEnabled = async (workflowId: number, enabled: boolean) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      })
      if (response.ok) {
        fetchWorkflows()
      }
    } catch (error) {
      console.error('Error toggling workflow:', error)
    }
  }

  const handleDelete = async (workflowId: number) => {
    if (!confirm('Are you sure you want to delete this workflow?')) {
      return
    }

    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        fetchWorkflows()
      }
    } catch (error) {
      console.error('Error deleting workflow:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-textMuted font-medium italic">Loading workflows...</p>
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
              Workflows
            </h1>
            <p className="mt-2 text-textMuted font-medium italic">
              Automate actions based on conditions
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-primary text-textPrimary font-bold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            + New Workflow
          </button>
        </div>

        {showCreate && (
          <div className="mb-6 bg-surfaceElevated border border-border/60 rounded-xl shadow-xl p-6">
            <h2 className="text-lg font-bold text-textPrimary mb-3">Create Workflow</h2>
            <p className="text-sm text-textMuted mb-4">
              Workflow creation requires JSON configuration. Use the API or create from templates.
            </p>
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 bg-surface text-textMuted border border-border/60 rounded-lg hover:bg-surfaceElevated transition-all"
            >
              Close
            </button>
          </div>
        )}

        {workflows.length === 0 ? (
          <div className="bg-surfaceElevated border border-border/60 rounded-xl shadow-xl p-20 text-center">
            <div className="w-16 h-16 bg-surface border border-border/60 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-textPrimary mb-2">No Workflows</h2>
            <p className="text-textMuted max-w-sm mx-auto">
              Create your first workflow to automate actions!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="bg-surfaceElevated border border-border/60 rounded-xl shadow-xl p-6 hover:bg-surface hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-bold text-textPrimary">
                        {workflow.name}
                      </h3>
                      <span
                        className={`px-2 py-0.5 text-xs font-bold uppercase tracking-widest rounded-lg ${
                          workflow.enabled
                            ? 'bg-success/20 text-success border border-success/30'
                            : 'bg-surface text-textMuted border border-border/60'
                        }`}
                      >
                        {workflow.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    {workflow.description && (
                      <p className="text-sm text-textMuted mb-2">
                        {workflow.description}
                      </p>
                    )}
                    <div className="text-sm text-textMuted space-y-1">
                      <p>Trigger: {workflow.trigger.type}</p>
                      <p>Actions: {workflow.actions.length}</p>
                      <p>Executions: {workflow.executionCount}</p>
                      {workflow.lastExecutedAt && (
                        <p>Last executed: {new Date(workflow.lastExecutedAt).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggleEnabled(workflow.id, workflow.enabled)}
                      className={`px-3 py-1 text-sm font-bold rounded-lg transition-all ${
                        workflow.enabled
                          ? 'bg-warning text-textPrimary hover:bg-warning/90 shadow-lg shadow-warning/20'
                          : 'bg-success text-textPrimary hover:bg-success/90 shadow-lg shadow-success/20'
                      }`}
                    >
                      {workflow.enabled ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDelete(workflow.id)}
                      className="px-3 py-1 text-sm bg-error text-textPrimary font-bold rounded-lg hover:bg-error/90 transition-all shadow-lg shadow-error/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
