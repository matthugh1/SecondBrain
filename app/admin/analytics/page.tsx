'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import TaskNavigation from '@/components/TaskNavigation'
import type { Admin } from '@/types'

export default function TaskAnalyticsPage() {
  const [tasks, setTasks] = useState<Admin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/admin?archived=false')
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'Done').length
    const inProgress = tasks.filter(t => t.status === 'In Progress').length
    const blocked = tasks.filter(t => t.status === 'Blocked').length
    const overdue = tasks.filter(t => {
      if (!t.due_date || t.status === 'Done') return false
      return new Date(t.due_date) < new Date()
    }).length

    const completionRate = total > 0 ? (completed / total) * 100 : 0

    const tasksWithTime = tasks.filter(t => t.actualDuration && t.estimatedDuration)
    const avgVariance = tasksWithTime.length > 0
      ? tasksWithTime.reduce((sum, t) => sum + ((t.actualDuration || 0) - (t.estimatedDuration || 0)), 0) / tasksWithTime.length
      : 0

    const priorityDistribution = {
      urgent: tasks.filter(t => t.priority === 'urgent').length,
      high: tasks.filter(t => t.priority === 'high').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      low: tasks.filter(t => t.priority === 'low').length,
    }

    const statusDistribution = {
      'Todo': tasks.filter(t => t.status === 'Todo').length,
      'In Progress': tasks.filter(t => t.status === 'In Progress').length,
      'Blocked': tasks.filter(t => t.status === 'Blocked').length,
      'Waiting': tasks.filter(t => t.status === 'Waiting').length,
      'Done': tasks.filter(t => t.status === 'Done').length,
      'Cancelled': tasks.filter(t => t.status === 'Cancelled').length,
    }

    return {
      total,
      completed,
      inProgress,
      blocked,
      overdue,
      completionRate,
      avgVariance,
      priorityDistribution,
      statusDistribution,
    }
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

  const stats = calculateStats()

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
            Task Analytics
          </h1>
          <p className="mt-2 text-textMuted font-medium italic">
            Insights and metrics for your tasks
          </p>
        </div>

        <TaskNavigation />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="p-6 bg-surfaceElevated rounded-xl border border-border/60">
            <div className="text-3xl font-bold text-textPrimary">{stats.total}</div>
            <div className="text-sm text-textMuted mt-1">Total Tasks</div>
          </div>
          <div className="p-6 bg-surfaceElevated rounded-xl border border-border/60">
            <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-textMuted mt-1">Completed</div>
          </div>
          <div className="p-6 bg-surfaceElevated rounded-xl border border-border/60">
            <div className="text-3xl font-bold text-blue-600">{stats.inProgress}</div>
            <div className="text-sm text-textMuted mt-1">In Progress</div>
          </div>
          <div className="p-6 bg-surfaceElevated rounded-xl border border-border/60">
            <div className="text-3xl font-bold text-red-600">{stats.overdue}</div>
            <div className="text-sm text-textMuted mt-1">Overdue</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="p-6 bg-surfaceElevated rounded-xl border border-border/60 shadow-xl">
            <h3 className="text-lg font-bold mb-4 text-textPrimary">Completion Rate</h3>
            <div className="text-4xl font-black text-textPrimary tracking-tight mb-2">
              {stats.completionRate.toFixed(1)}%
            </div>
            <div className="w-full bg-surface rounded-full h-4 border border-border/60">
              <div
                className="bg-success h-4 rounded-full transition-all shadow-lg shadow-success/20"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>

          <div className="p-6 bg-surfaceElevated rounded-xl border border-border/60 shadow-xl">
            <h3 className="text-lg font-bold mb-4 text-textPrimary">Time Variance</h3>
            <div className="text-4xl font-black text-textPrimary tracking-tight">
              {stats.avgVariance > 0 ? '+' : ''}
              {stats.avgVariance.toFixed(1)} min
            </div>
            <div className="text-sm text-textMuted mt-2">
              Average difference between estimated and actual time
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 bg-surfaceElevated rounded-xl border border-border/60 shadow-xl">
            <h3 className="text-lg font-bold mb-4 text-textPrimary">Priority Distribution</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-textMuted">Urgent</span>
                  <span className="text-sm font-bold text-textPrimary">{stats.priorityDistribution.urgent}</span>
                </div>
                <div className="w-full bg-surface rounded-full h-2 border border-border/60">
                  <div
                    className="bg-error h-2 rounded-full shadow-lg shadow-error/20"
                    style={{ width: `${(stats.priorityDistribution.urgent / stats.total) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-textMuted">High</span>
                  <span className="text-sm font-bold text-textPrimary">{stats.priorityDistribution.high}</span>
                </div>
                <div className="w-full bg-surface rounded-full h-2 border border-border/60">
                  <div
                    className="bg-warning h-2 rounded-full shadow-lg shadow-warning/20"
                    style={{ width: `${(stats.priorityDistribution.high / stats.total) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-textMuted">Medium</span>
                  <span className="text-sm font-bold text-textPrimary">{stats.priorityDistribution.medium}</span>
                </div>
                <div className="w-full bg-surface rounded-full h-2 border border-border/60">
                  <div
                    className="bg-highlight h-2 rounded-full shadow-lg shadow-highlight/20"
                    style={{ width: `${(stats.priorityDistribution.medium / stats.total) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-textMuted">Low</span>
                  <span className="text-sm font-bold text-textPrimary">{stats.priorityDistribution.low}</span>
                </div>
                <div className="w-full bg-surface rounded-full h-2 border border-border/60">
                  <div
                    className="bg-info h-2 rounded-full shadow-lg shadow-info/20"
                    style={{ width: `${(stats.priorityDistribution.low / stats.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-surfaceElevated rounded-xl border border-border/60 shadow-xl">
            <h3 className="text-lg font-bold mb-4 text-textPrimary">Status Distribution</h3>
            <div className="space-y-3">
              {Object.entries(stats.statusDistribution).map(([status, count]) => (
                <div key={status}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-textMuted">{status}</span>
                    <span className="text-sm font-bold text-textPrimary">{count}</span>
                  </div>
                  <div className="w-full bg-surface rounded-full h-2 border border-border/60">
                    <div
                      className={`h-2 rounded-full shadow-lg ${
                        status === 'Done' ? 'bg-success shadow-success/20' :
                        status === 'In Progress' ? 'bg-info shadow-info/20' :
                        status === 'Blocked' ? 'bg-error shadow-error/20' :
                        status === 'Waiting' ? 'bg-warning shadow-warning/20' :
                        'bg-textMuted'
                      }`}
                      style={{ width: `${(count / stats.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
