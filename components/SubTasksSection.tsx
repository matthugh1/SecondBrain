'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Admin } from '@/types'

interface SubTasksSectionProps {
  taskId: number
  onUpdate: () => void
}

export default function SubTasksSection({ taskId, onUpdate }: SubTasksSectionProps) {
  const [subTasks, setSubTasks] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTaskName, setNewTaskName] = useState('')

  if (!taskId) {
    return null
  }

  useEffect(() => {
    if (taskId) {
      fetchSubTasks()
    }
  }, [taskId])

  const fetchSubTasks = async () => {
    if (!taskId) return
    try {
      const response = await fetch(`/api/admin/${taskId}/sub-tasks`)
      if (response.ok) {
        const data = await response.json()
        setSubTasks(data.subTasks || [])
      }
    } catch (error) {
      console.error('Error fetching sub-tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSubTask = async () => {
    if (!newTaskName.trim()) return

    try {
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTaskName,
          parentTaskId: taskId,
          status: 'Todo',
        }),
      })

      if (response.ok) {
        setNewTaskName('')
        setShowAddForm(false)
        fetchSubTasks()
        onUpdate()
      }
    } catch (error) {
      console.error('Error creating sub-task:', error)
    }
  }

  if (loading) {
    return null
  }

  return (
    <div className="mt-8 pt-6 border-t border-border/60">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-textPrimary">
          Sub-tasks ({subTasks.length})
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-3 py-1 text-sm bg-primary text-textPrimary rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-medium"
        >
          {showAddForm ? 'Cancel' : '+ Add Sub-task'}
        </button>
      </div>

      {showAddForm && (
        <div className="mb-4 p-4 bg-surfaceElevated border border-border/60 rounded-lg">
          <input
            type="text"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            placeholder="Enter sub-task name..."
            className="w-full px-4 py-2.5 bg-surface border border-border/60 rounded-xl text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all mb-2"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleCreateSubTask()
              }
            }}
          />
          <button
            onClick={handleCreateSubTask}
            className="px-4 py-2 bg-primary text-textPrimary rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-medium"
          >
            Create
          </button>
        </div>
      )}

      {subTasks.length === 0 && !showAddForm ? (
        <p className="text-sm text-textMuted">No sub-tasks yet</p>
      ) : (
        <div className="space-y-2">
          {subTasks.map((subTask) => (
            <div
              key={subTask.id}
              className="p-3 border border-border/60 rounded-lg bg-surfaceElevated hover:bg-surface transition-all"
            >
              <Link
                href={`/admin/${subTask.id}`}
                className="flex items-center justify-between"
              >
                <span className="font-medium text-textPrimary hover:text-primary transition-colors">
                  {subTask.name}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                  subTask.status === 'Done'
                    ? 'bg-success/20 text-success border border-success/30'
                    : subTask.status === 'In Progress'
                    ? 'bg-info/20 text-info border border-info/30'
                    : 'bg-surface text-textMuted border border-border/60'
                }`}>
                  {subTask.status}
                </span>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
