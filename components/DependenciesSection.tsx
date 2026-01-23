'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { TaskDependency } from '@/types'

interface DependenciesSectionProps {
  taskId: number
  onUpdate: () => void
}

export default function DependenciesSection({ taskId, onUpdate }: DependenciesSectionProps) {
  const [blocking, setBlocking] = useState<any[]>([])
  const [blockedBy, setBlockedBy] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newDependencyId, setNewDependencyId] = useState('')
  const [dependencyType, setDependencyType] = useState<'blocks' | 'blocked_by'>('blocks')

  if (!taskId) {
    return null
  }

  useEffect(() => {
    if (taskId) {
      fetchDependencies()
    }
  }, [taskId])

  const fetchDependencies = async () => {
    if (!taskId) return
    try {
      const response = await fetch(`/api/admin/${taskId}/dependencies`)
      if (response.ok) {
        const data = await response.json()
        setBlocking(data.blocking || [])
        setBlockedBy(data.blockedBy || [])
      }
    } catch (error) {
      console.error('Error fetching dependencies:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateDependency = async () => {
    if (!newDependencyId.trim()) return

    try {
      const dependsOnTaskId = dependencyType === 'blocks' ? parseInt(newDependencyId) : taskId
      const blockingTaskId = dependencyType === 'blocks' ? taskId : parseInt(newDependencyId)

      const response = await fetch('/api/admin/dependencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: blockingTaskId,
          dependsOnTaskId,
          dependencyType: 'blocks',
        }),
      })

      if (response.ok) {
        setNewDependencyId('')
        setShowAddForm(false)
        fetchDependencies()
        onUpdate()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create dependency')
      }
    } catch (error) {
      console.error('Error creating dependency:', error)
      alert('Failed to create dependency')
    }
  }

  const handleDeleteDependency = async (depTaskId: number, type: 'blocks' | 'blocked_by') => {
    if (!confirm('Remove this dependency?')) return

    try {
      const dependsOnTaskId = type === 'blocks' ? depTaskId : taskId
      const blockingTaskId = type === 'blocks' ? taskId : depTaskId

      const response = await fetch('/api/admin/dependencies', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: blockingTaskId,
          dependsOnTaskId,
        }),
      })

      if (response.ok) {
        fetchDependencies()
        onUpdate()
      }
    } catch (error) {
      console.error('Error deleting dependency:', error)
    }
  }

  if (loading) {
    return null
  }

  return (
    <div className="mt-8 pt-6 border-t border-border/60">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-textPrimary">
          Dependencies
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1 text-sm bg-primary text-textPrimary rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-medium"
        >
          {showAddForm ? 'Cancel' : '+ Add Dependency'}
        </button>
      </div>

      {showAddForm && (
        <div className="mb-4 p-4 bg-surfaceElevated border border-border/60 rounded-lg">
          <select
            value={dependencyType}
            onChange={(e) => setDependencyType(e.target.value as 'blocks' | 'blocked_by')}
            className="w-full px-4 py-2.5 bg-surface border border-border/60 rounded-xl text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all mb-2"
          >
            <option value="blocks">This task blocks</option>
            <option value="blocked_by">This task is blocked by</option>
          </select>
          <input
            type="number"
            value={newDependencyId}
            onChange={(e) => setNewDependencyId(e.target.value)}
            placeholder="Task ID..."
            className="w-full px-4 py-2.5 bg-surface border border-border/60 rounded-xl text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all mb-2"
          />
          <button
            onClick={handleCreateDependency}
            className="px-4 py-2 bg-primary text-textPrimary rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-medium"
          >
            Create
          </button>
        </div>
      )}

      {blocking.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-bold text-textMuted uppercase tracking-widest mb-2">
            Blocks ({blocking.length})
          </h4>
          <div className="space-y-2">
            {blocking.map((dep) => (
              <div
                key={dep.id}
                className="p-3 border border-border/60 rounded-lg bg-surfaceElevated flex items-center justify-between hover:bg-surface transition-all"
              >
                <Link
                  href={`/admin/${dep.dependsOnTaskId}`}
                  className="text-secondary hover:text-secondary/80 transition-colors"
                >
                  Task #{dep.dependsOnTaskId}
                </Link>
                <button
                  onClick={() => handleDeleteDependency(dep.dependsOnTaskId, 'blocks')}
                  className="text-error hover:text-error/80 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {blockedBy.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-textMuted uppercase tracking-widest mb-2">
            Blocked By ({blockedBy.length})
          </h4>
          <div className="space-y-2">
            {blockedBy.map((dep) => (
              <div
                key={dep.id}
                className="p-3 border border-border/60 rounded-lg bg-surfaceElevated flex items-center justify-between hover:bg-surface transition-all"
              >
                <Link
                  href={`/admin/${dep.taskId}`}
                  className="text-secondary hover:text-secondary/80 transition-colors"
                >
                  Task #{dep.taskId}
                </Link>
                <button
                  onClick={() => handleDeleteDependency(dep.taskId, 'blocked_by')}
                  className="text-error hover:text-error/80 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {blocking.length === 0 && blockedBy.length === 0 && !showAddForm && (
        <p className="text-sm text-textMuted">No dependencies</p>
      )}
    </div>
  )
}
