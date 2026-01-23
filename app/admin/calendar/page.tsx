'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import TaskNavigation from '@/components/TaskNavigation'
import type { Admin } from '@/types'

type ViewMode = 'month' | 'week' | 'day'

const priorityColors: Record<string, string> = {
  urgent: 'bg-error border-error/60',
  high: 'bg-warning border-warning/60',
  medium: 'bg-highlight border-highlight/60',
  low: 'bg-info border-info/60',
}

export default function CalendarViewPage() {
  const [tasks, setTasks] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/admin')
      if (response.ok) {
        const data = await response.json()
        setTasks(data.filter((t: Admin) => !t.archived && t.due_date))
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTasksForDate = (date: Date): Admin[] => {
    const dateStr = date.toISOString().split('T')[0]
    return tasks.filter(task => task.due_date === dateStr)
  }

  const getOverdueTasks = (): Admin[] => {
    const today = new Date().toISOString().split('T')[0]
    return tasks.filter(task => 
      task.due_date && 
      task.due_date < today && 
      task.status !== 'Done'
    )
  }

  const renderMonthView = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - startDate.getDay())
    
    const days: Date[] = []
    const current = new Date(startDate)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return (
      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center font-bold text-sm text-textMuted uppercase tracking-widest">
            {day}
          </div>
        ))}
        {days.map((date, idx) => {
          const dateTasks = getTasksForDate(date)
          const isCurrentMonth = date.getMonth() === month
          const isToday = date.toDateString() === new Date().toDateString()
          
          return (
            <div
              key={idx}
              className={`min-h-[100px] p-2 border border-border/60 rounded-lg transition-all ${
                isCurrentMonth ? 'bg-surfaceElevated' : 'bg-surface'
              } ${isToday ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : ''}`}
            >
              <div className={`text-sm font-medium mb-1 ${isCurrentMonth ? 'text-textPrimary' : 'text-textMuted'}`}>
                {date.getDate()}
              </div>
              <div className="space-y-1">
                {dateTasks.slice(0, 3).map(task => (
                  <Link
                    key={task.id}
                    href={`/admin/${task.id}`}
                    className={`block p-1 text-xs rounded truncate border-l-2 transition-all hover:opacity-80 ${
                      priorityColors[task.priority || 'medium'] || 'bg-surface border-border'
                    } text-textPrimary`}
                    title={task.name}
                  >
                    {task.name}
                  </Link>
                ))}
                {dateTasks.length > 3 && (
                  <div className="text-xs text-textMuted">
                    +{dateTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    
    const weekDays: Date[] = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(day.getDate() + i)
      weekDays.push(day)
    }

    return (
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((date, idx) => {
          const dateTasks = getTasksForDate(date)
          const isToday = date.toDateString() === new Date().toDateString()
          
          return (
            <div key={idx} className={`p-4 border border-border/60 rounded-lg bg-surfaceElevated transition-all ${
              isToday ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : ''
            }`}>
              <div className="font-bold mb-2 text-textPrimary">
                {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
              <div className="space-y-2">
                {dateTasks.map(task => (
                  <Link
                    key={task.id}
                    href={`/admin/${task.id}`}
                    className={`block p-2 text-sm rounded border-l-2 transition-all hover:opacity-80 ${
                      priorityColors[task.priority || 'medium'] || 'bg-surface border-border'
                    } text-textPrimary`}
                  >
                    {task.name}
                  </Link>
                ))}
                {dateTasks.length === 0 && (
                  <div className="text-sm text-textMuted">No tasks</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderDayView = () => {
    const dayTasks = getTasksForDate(currentDate)
    const isToday = currentDate.toDateString() === new Date().toDateString()
    
    return (
      <div className={`p-6 border border-border/60 rounded-lg bg-surfaceElevated transition-all ${
        isToday ? 'ring-2 ring-primary shadow-lg shadow-primary/20' : ''
      }`}>
        <div className="font-bold text-xl mb-4 text-textPrimary">
          {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        <div className="space-y-2">
          {dayTasks.map(task => (
            <Link
              key={task.id}
              href={`/admin/${task.id}`}
              className={`block p-3 rounded-lg border-l-4 transition-all hover:opacity-80 ${
                priorityColors[task.priority || 'medium'] || 'bg-surface border-border'
              } text-textPrimary`}
            >
              <div className="font-medium">{task.name}</div>
              {task.status && (
                <div className="text-xs text-textMuted mt-1">Status: {task.status}</div>
              )}
            </Link>
          ))}
          {dayTasks.length === 0 && (
            <div className="text-textMuted">No tasks scheduled for this day</div>
          )}
        </div>
      </div>
    )
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    }
    setCurrentDate(newDate)
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

  const overdueTasks = getOverdueTasks()

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-textPrimary tracking-tight">
                Calendar View
              </h1>
              <p className="mt-2 text-textMuted font-medium italic">
            View tasks by date
          </p>
        </div>

        <TaskNavigation />
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('month')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === 'month'
                    ? 'bg-primary text-textPrimary shadow-lg shadow-primary/20'
                    : 'bg-surface text-textMuted hover:bg-surfaceElevated border border-border/60'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === 'week'
                    ? 'bg-primary text-textPrimary shadow-lg shadow-primary/20'
                    : 'bg-surface text-textMuted hover:bg-surfaceElevated border border-border/60'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  viewMode === 'day'
                    ? 'bg-primary text-textPrimary shadow-lg shadow-primary/20'
                    : 'bg-surface text-textMuted hover:bg-surfaceElevated border border-border/60'
                }`}
              >
                Day
              </button>
            </div>
          </div>
        </div>

        {overdueTasks.length > 0 && (
          <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg">
            <h3 className="font-bold text-error mb-2">
              Overdue Tasks ({overdueTasks.length})
            </h3>
            <div className="space-y-1">
              {overdueTasks.map(task => (
                <Link
                  key={task.id}
                  href={`/admin/${task.id}`}
                  className="block text-sm text-error hover:text-error/80 transition-colors"
                >
                  {task.name} - Due: {task.due_date}
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => navigateDate('prev')}
              className="px-4 py-2 bg-surface text-textMuted rounded-lg hover:bg-surfaceElevated border border-border/60 transition-all"
            >
              ← Prev
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 bg-surface text-textMuted rounded-lg hover:bg-surfaceElevated border border-border/60 transition-all"
            >
              Today
            </button>
            <button
              onClick={() => navigateDate('next')}
              className="px-4 py-2 bg-surface text-textMuted rounded-lg hover:bg-surfaceElevated border border-border/60 transition-all"
            >
              Next →
            </button>
          </div>
          <div className="font-bold text-textPrimary">
            {viewMode === 'month' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            {viewMode === 'week' && `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
            {viewMode === 'day' && currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
        </div>

        <div className="bg-surfaceElevated border border-border/60 rounded-xl shadow-xl p-6">
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </div>
      </div>
    </div>
  )
}
