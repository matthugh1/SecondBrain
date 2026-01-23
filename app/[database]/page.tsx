'use client'

import DatabaseTable from '@/components/DatabaseTable'
import TaskNavigation from '@/components/TaskNavigation'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const databaseConfigs: Record<
  string,
  { label: string; columns: { key: string; label: string }[] }
> = {
  people: {
    label: 'People',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'context', label: 'Context' },
      { key: 'follow_ups', label: 'Follow-ups' },
      { key: 'last_touched', label: 'Last Touched' },
    ],
  },
  projects: {
    label: 'Projects',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status' },
      { key: 'next_action', label: 'Next Action' },
    ],
  },
  ideas: {
    label: 'Ideas',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'one_liner', label: 'One-Liner' },
      { key: 'last_touched', label: 'Last Touched' },
    ],
  },
  admin: {
    label: 'Tasks',
    columns: [
      { key: 'priority', label: 'Priority' },
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status' },
      { key: 'startDate', label: 'Start Date' },
      { key: 'due_date', label: 'Due Date' },
      { key: 'projectId', label: 'Project' },
    ],
  },
}

function getDisplayValue(item: any, key: string): string | React.ReactNode {
  const value = item[key]
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  
  // Special handling for priority
  if (key === 'priority') {
    const priorityColors: Record<string, string> = {
      urgent: 'bg-error text-textPrimary',
      high: 'bg-warning text-textPrimary',
      medium: 'bg-highlight text-textPrimary',
      low: 'bg-info text-textPrimary',
    }
    const color = priorityColors[value] || 'bg-surface text-textMuted'
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
        {value}
      </span>
    )
  }
  
  // Special handling for status with color coding
  if (key === 'status') {
    const statusColors: Record<string, string> = {
      'Todo': 'bg-surface text-textMuted border border-border/60',
      'In Progress': 'bg-info/20 text-info border border-info/30',
      'Blocked': 'bg-error/20 text-error border border-error/30',
      'Waiting': 'bg-warning/20 text-warning border border-warning/30',
      'Done': 'bg-success/20 text-success border border-success/30',
      'Cancelled': 'bg-surface text-textMuted border border-border/60',
    }
    const colorClass = statusColors[value] || 'bg-surface text-textMuted border border-border/60'
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
        {value}
      </span>
    )
  }
  
  // Format dates
  if (key === 'due_date' || key === 'startDate') {
    if (typeof value === 'string') {
      try {
        const date = new Date(value)
        return date.toLocaleDateString()
      } catch {
        return value
      }
    }
  }
  
  return String(value)
}

export default function DatabasePage({
  params,
}: {
  params: { database: string }
}) {

  // Exclude routes that have their own pages - redirect them
  // Also handle common typos
  const excludedRoutes: Record<string, string> = {
    'calendar': '/calendar',
    'calandar': '/calendar', // Handle typo: "calandar" -> "calendar"
    'calander': '/calendar', // Handle typo: "calander" -> "calendar"
    'calender': '/calendar', // Handle typo: "calender" -> "calendar"
    'digests': '/digests',
    'inbox-log': '/inbox-log',
    'timeline': '/timeline',
    'settings': '/settings',
    'rules': '/rules',
  }


  // CRITICAL: Check for excluded routes FIRST, before anything else
  // This must happen before any other logic
  const isExcludedRoute = excludedRoutes[params.database]

  if (isExcludedRoute) {

    // IMMEDIATE redirect - execute synchronously if possible
    if (typeof window !== 'undefined') {
      window.location.replace(isExcludedRoute)
    }

    // Also use useEffect as backup AND meta refresh for immediate redirect
    useEffect(() => {
      if (typeof window !== 'undefined' && window.location.pathname !== isExcludedRoute) {
        window.location.replace(isExcludedRoute)
      }
    }, [params.database, isExcludedRoute])

    // Show loading while redirecting with meta refresh as backup
    return (
      <>
        <head>
          <meta httpEquiv="refresh" content={`0;url=${isExcludedRoute}`} />
        </head>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-textPrimary">
              Redirecting to {isExcludedRoute}...
            </h1>
            <p className="mt-4">
              <a href={isExcludedRoute} className="text-secondary hover:text-secondary/80 underline text-lg transition-colors">
                Click here if you're not redirected automatically
              </a>
            </p>
          </div>
        </div>
      </>
    )
  }


  const config = databaseConfigs[params.database]

  if (!config) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-textPrimary">
            404 - Database not found
          </h1>
          <Link
            href="/"
            className="mt-4 text-secondary hover:text-secondary/80 transition-colors"
          >
            Return to dashboard
          </Link>
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
              {config.label}
            </h1>
            <p className="mt-2 text-textMuted font-medium italic">
              View and manage {config.label.toLowerCase()}
            </p>
          </div>
        </div>

        {/* Task Navigation Menu for admin */}
        {params.database === 'admin' && <TaskNavigation />}

        <div className="mt-6">
          <DatabaseTable
            database={params.database}
            columns={config.columns.map(col => ({
              ...col,
              editable: col.key !== 'id' && col.key !== 'created_at' && col.key !== 'updated_at',
              type: col.key === 'status' && (params.database === 'projects' || params.database === 'admin')
                ? 'select'
                : col.key === 'due_date' && params.database === 'admin'
                  ? 'datetime-local'
                  : 'text',
              options: col.key === 'status' && params.database === 'projects'
                ? [
                  { value: 'Active', label: 'Active' },
                  { value: 'Waiting', label: 'Waiting' },
                  { value: 'Blocked', label: 'Blocked' },
                  { value: 'Someday', label: 'Someday' },
                  { value: 'Done', label: 'Done' },
                ]
                : col.key === 'status' && params.database === 'admin'
                  ? [
                    { value: 'Todo', label: 'Todo' },
                    { value: 'In Progress', label: 'In Progress' },
                    { value: 'Blocked', label: 'Blocked' },
                    { value: 'Waiting', label: 'Waiting' },
                    { value: 'Done', label: 'Done' },
                    { value: 'Cancelled', label: 'Cancelled' },
                  ]
                  : col.key === 'priority' && params.database === 'admin'
                    ? [
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'high', label: 'High' },
                      { value: 'urgent', label: 'Urgent' },
                    ]
                    : undefined,
            }))}
            getDisplayValue={getDisplayValue}
            statusOptions={
              params.database === 'projects'
                ? [
                  { value: 'Active', label: 'Active' },
                  { value: 'Waiting', label: 'Waiting' },
                  { value: 'Blocked', label: 'Blocked' },
                  { value: 'Someday', label: 'Someday' },
                  { value: 'Done', label: 'Done' },
                ]
                : params.database === 'admin'
                  ? [
                    { value: 'Todo', label: 'Todo' },
                    { value: 'In Progress', label: 'In Progress' },
                    { value: 'Blocked', label: 'Blocked' },
                    { value: 'Waiting', label: 'Waiting' },
                    { value: 'Done', label: 'Done' },
                    { value: 'Cancelled', label: 'Cancelled' },
                  ]
                  : []
            }
          />
        </div>
      </div>
    </div>
  )
}
