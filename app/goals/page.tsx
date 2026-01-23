'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Goal {
  id: number
  name: string
  description?: string
  targetDate?: string
  status: string
  progress: number
  progressMethod: string
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'paused'>('all')
  const [showCreate, setShowCreate] = useState(false)
  const [newGoal, setNewGoal] = useState({ name: '', description: '', targetDate: '', progressMethod: 'manual' })

  useEffect(() => {
    fetchGoals()
  }, [filter])

  const fetchGoals = async () => {
    setLoading(true)
    try {
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const response = await fetch(`/api/goals${params}`)
      if (response.ok) {
        const data = await response.json()
        setGoals(data.goals || [])
      }
    } catch (error) {
      console.error('Error fetching goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGoal),
      })
      if (response.ok) {
        setShowCreate(false)
        setNewGoal({ name: '', description: '', targetDate: '', progressMethod: 'manual' })
        fetchGoals()
      }
    } catch (error) {
      console.error('Error creating goal:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-success/20 text-success border border-success/30'
      case 'completed':
        return 'bg-info/20 text-info border border-info/30'
      case 'paused':
        return 'bg-warning/20 text-warning border border-warning/30'
      case 'cancelled':
        return 'bg-surface text-textMuted border border-border/60'
      default:
        return 'bg-surface text-textMuted border border-border/60'
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'bg-success'
    if (progress >= 50) return 'bg-info'
    if (progress >= 25) return 'bg-warning'
    return 'bg-error'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-textMuted font-medium italic">Loading goals...</p>
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
              Goals
            </h1>
            <p className="mt-2 text-textMuted font-medium italic">
              Track progress toward your objectives
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-primary text-textPrimary font-bold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            + New Goal
          </button>
        </div>

        {showCreate && (
          <div className="mb-6 bg-surfaceElevated border border-border/60 rounded-xl shadow-xl p-6">
            <h2 className="text-lg font-bold text-textPrimary mb-3">Create Goal</h2>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Goal name"
                value={newGoal.name}
                onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-border/60 rounded-lg text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
              <textarea
                placeholder="Description (optional)"
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-border/60 rounded-lg text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                rows={3}
              />
              <div className="flex gap-3">
                <input
                  type="date"
                  value={newGoal.targetDate}
                  onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                  className="px-3 py-2 bg-surface border border-border/60 rounded-lg text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <select
                  value={newGoal.progressMethod}
                  onChange={(e) => setNewGoal({ ...newGoal, progressMethod: e.target.value })}
                  className="px-3 py-2 bg-surface border border-border/60 rounded-lg text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                >
                  <option value="manual">Manual Progress</option>
                  <option value="auto_from_items">Auto from Linked Items</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  className="px-4 py-2 bg-primary text-textPrimary font-bold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 bg-surface text-textMuted border border-border/60 rounded-lg hover:bg-surfaceElevated transition-all"
                >
                  Cancel
                </button>
              </div>
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
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'active'
                ? 'bg-primary text-textPrimary shadow-lg shadow-primary/20'
                : 'bg-surface text-textMuted hover:bg-surfaceElevated border border-border/60'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'completed'
                ? 'bg-primary text-textPrimary shadow-lg shadow-primary/20'
                : 'bg-surface text-textMuted hover:bg-surfaceElevated border border-border/60'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('paused')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'paused'
                ? 'bg-primary text-textPrimary shadow-lg shadow-primary/20'
                : 'bg-surface text-textMuted hover:bg-surfaceElevated border border-border/60'
            }`}
          >
            Paused
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="bg-surfaceElevated border border-border/60 rounded-xl shadow-xl p-20 text-center">
            <div className="w-16 h-16 bg-surface border border-border/60 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-textPrimary mb-2">No Goals</h2>
            <p className="text-textMuted max-w-sm mx-auto">
              Create your first goal to get started!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="bg-surfaceElevated border border-border/60 rounded-xl shadow-xl p-6 hover:bg-surface hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-2">
                  <Link
                    href={`/goals/${goal.id}`}
                    className="font-bold text-textPrimary hover:text-primary transition-colors"
                  >
                    {goal.name}
                  </Link>
                  <span
                    className={`px-2 py-0.5 text-xs font-bold uppercase tracking-widest rounded-lg ${getStatusColor(goal.status)}`}
                  >
                    {goal.status}
                  </span>
                </div>
                {goal.description && (
                  <p className="text-sm text-textMuted mb-3">
                    {goal.description}
                  </p>
                )}
                <div className="mb-2">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-textMuted font-medium">Progress</span>
                    <span className="font-bold text-textPrimary">{Math.round(goal.progress)}%</span>
                  </div>
                  <div className="w-full bg-surface rounded-full h-2 border border-border/60">
                    <div
                      className={`h-2 rounded-full transition-all ${getProgressColor(goal.progress)}`}
                      style={{ width: `${Math.min(goal.progress, 100)}%` }}
                    />
                  </div>
                </div>
                {goal.targetDate && (
                  <p className="text-xs text-textMuted mt-2">
                    Target: {new Date(goal.targetDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
