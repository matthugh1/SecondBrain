'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import TaskNavigation from '@/components/TaskNavigation'
import type { Admin } from '@/types'

export default function TimelineViewPage() {
  const [tasks, setTasks] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({ start: new Date(), end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) })

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/admin?archived=false')
      if (response.ok) {
        const data = await response.json()
        setTasks(data.filter((t: Admin) => t.startDate || t.due_date))
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysBetween = (start: Date, end: Date): number => {
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getTaskPosition = (task: Admin): { left: number; width: number } => {
    if (!task.startDate && !task.due_date) {
      return { left: 0, width: 0 }
    }

    const start = task.startDate ? new Date(task.startDate) : new Date()
    const end = task.due_date ? new Date(task.due_date) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    const rangeStart = dateRange.start
    const rangeEnd = dateRange.end
    const totalDays = getDaysBetween(rangeStart, rangeEnd)
    
    const daysFromStart = getDaysBetween(rangeStart, start)
    const taskDuration = getDaysBetween(start, end)
    
    const left = (daysFromStart / totalDays) * 100
    const width = (taskDuration / totalDays) * 100
    
    return { left: Math.max(0, left), width: Math.min(100, width) }
  }

  const priorityColors: Record<string, string> = {
    urgent: 'bg-error',
    high: 'bg-warning',
    medium: 'bg-highlight',
    low: 'bg-info',
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
            Timeline View
          </h1>
          <p className="mt-2 text-textMuted font-medium italic">
            Gantt-style timeline showing task duration and dependencies
          </p>
        </div>

        <TaskNavigation />

        <div className="bg-surfaceElevated border border-border/60 rounded-xl shadow-xl p-6 overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Date header */}
            <div className="flex border-b border-border/60 mb-4">
              {Array.from({ length: 30 }, (_, i) => {
                const date = new Date(dateRange.start)
                date.setDate(date.getDate() + i)
                return (
                  <div key={i} className="flex-1 text-center text-xs py-2 border-r border-border/60 text-textMuted font-bold uppercase tracking-widest">
                    {date.getDate()}
                  </div>
                )
              })}
            </div>

            {/* Tasks */}
            <div className="space-y-2">
              {tasks.map((task) => {
                const position = getTaskPosition(task)
                return (
                  <div key={task.id} className="relative h-12">
                    <div className="absolute top-0 left-0 w-48 text-sm font-medium truncate pr-2 text-textPrimary">
                      {task.name}
                    </div>
                    <div className="ml-48 relative h-full">
                      <Link
                        href={`/admin/${task.id}`}
                        className={`absolute h-8 rounded transition-all hover:opacity-80 hover:shadow-lg shadow-primary/20 cursor-pointer ${
                          priorityColors[task.priority || 'medium'] || 'bg-textMuted'
                        } text-textPrimary text-xs px-2 flex items-center`}
                        style={{
                          left: `${position.left}%`,
                          width: `${Math.max(position.width, 2)}%`,
                        }}
                        title={`${task.name} (${task.status})`}
                      >
                        <span className="truncate">{task.name}</span>
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>

            {tasks.length === 0 && (
              <div className="text-center py-8 text-textMuted">
                No tasks with dates to display
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
