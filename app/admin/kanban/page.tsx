'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import TaskNavigation from '@/components/TaskNavigation'
import type { Admin, TaskStatus } from '@/types'

const statusColumns: TaskStatus[] = ['Todo', 'In Progress', 'Blocked', 'Waiting', 'Done', 'Cancelled']

const statusColors: Record<TaskStatus, string> = {
  'Todo': 'bg-surface border-border/60',
  'In Progress': 'bg-info/20 border-info/30',
  'Blocked': 'bg-error/20 border-error/30',
  'Waiting': 'bg-warning/20 border-warning/30',
  'Done': 'bg-success/20 border-success/30',
  'Cancelled': 'bg-surface border-border/60',
}

const priorityColors: Record<string, string> = {
  urgent: 'bg-error',
  high: 'bg-warning',
  medium: 'bg-highlight',
  low: 'bg-info',
}

export default function KanbanBoardPage() {
  const [tasks, setTasks] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedTask, setDraggedTask] = useState<Admin | null>(null)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/admin')
      if (response.ok) {
        const data = await response.json()
        setTasks(data.filter((t: Admin) => !t.archived))
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDragStart = (task: Admin) => {
    setDraggedTask(task)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (newStatus: TaskStatus) => {
    if (!draggedTask) return

    try {
      const response = await fetch(`/api/admin/${draggedTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        fetchTasks()
      }
    } catch (error) {
      console.error('Error updating task status:', error)
    } finally {
      setDraggedTask(null)
    }
  }

  const getTasksByStatus = (status: TaskStatus): Admin[] => {
    return tasks.filter(task => task.status === status)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center py-8 text-textMuted">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <nav className="mb-4">
            <Link
              href="/"
              className="text-xs font-bold text-primary uppercase tracking-widest hover:text-primary/80 transition-colors flex items-center gap-1 group"
            >
              ← Dashboard
            </Link>
          </nav>
          <h1 className="text-4xl font-black text-textPrimary tracking-tight">
            Kanban Board
          </h1>
          <p className="mt-2 text-textMuted font-medium italic">
            Drag and drop tasks to change status
          </p>
        </div>

        <TaskNavigation />

        <div className="flex gap-3 overflow-x-auto pb-4">
          {statusColumns.map((status) => {
            const columnTasks = getTasksByStatus(status)
            return (
              <div
                key={status}
                className="flex-shrink-0 w-64"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(status)}
              >
                <div className={`p-3 rounded-t-lg border border-border/60 ${statusColors[status]}`}>
                  <h2 className="font-bold text-sm text-textPrimary">{status}</h2>
                  <span className="text-xs text-textMuted">{columnTasks.length} tasks</span>
                </div>
                <div className="bg-surfaceElevated border-x border-b border-border/60 rounded-b-lg p-2 min-h-[500px] space-y-2">
                  {columnTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task)}
                      className="p-3 bg-surface border border-border/60 rounded-lg shadow-lg hover:shadow-primary/20 hover:-translate-y-1 transition-all duration-300 cursor-move"
                    >
                      <div className="flex items-start justify-between mb-1.5 gap-2">
                        <Link
                          href={`/admin/${task.id}`}
                          className="font-medium text-sm text-textPrimary hover:text-primary transition-colors flex-1 line-clamp-2"
                        >
                          {task.name}
                        </Link>
                        {task.priority && (
                          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5 ${priorityColors[task.priority] || 'bg-textMuted'}`} />
                        )}
                      </div>
                      {task.due_date && (
                        <div className="text-xs text-textMuted">
                          {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                      {task.projectId && (
                        <div className="text-xs text-secondary mt-1">
                          #{task.projectId}
                        </div>
                      )}
                    </div>
                  ))}
                  {columnTasks.length === 0 && (
                    <div className="text-center text-textMuted py-8 text-xs">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
