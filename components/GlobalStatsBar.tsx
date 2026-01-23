'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import StatsCard from '@/components/StatsCard'
import SkeletonCard from '@/components/SkeletonCard'
import { useDataUpdate } from '@/contexts/DataUpdateContext'

export default function GlobalStatsBar() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const { subscribe } = useDataUpdate()
  const [showAll, setShowAll] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    people: 0,
    projects: 0,
    ideas: 0,
    admin: 0,
    inboxLog: 0,
    goals: 0,
    reminders: 0,
  })

  // Load preferences from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCollapsed = localStorage.getItem('statsBarCollapsed')
      const savedShowAll = localStorage.getItem('statsBarShowAll')
      if (savedCollapsed !== null) {
        setCollapsed(JSON.parse(savedCollapsed))
      }
      if (savedShowAll !== null) {
        setShowAll(JSON.parse(savedShowAll))
      }
    }
  }, [])

  // Save preferences to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('statsBarCollapsed', JSON.stringify(collapsed))
      localStorage.setItem('statsBarShowAll', JSON.stringify(showAll))
    }
  }, [collapsed, showAll])

  const fetchStats = () => {
    setIsLoading(true)
    Promise.all([
      fetch('/api/people').then((r) => r.json()),
      fetch('/api/projects').then((r) => r.json()),
      fetch('/api/ideas').then((r) => r.json()),
      fetch('/api/admin').then((r) => r.json()),
      fetch('/api/inbox-log').then((r) => r.json()),
      fetch('/api/goals').then((r) => r.json()).catch(() => ({ goals: [] })),
      fetch('/api/reminders').then((r) => r.json()).catch(() => ({ reminders: [] })),
    ])
      .then(([people, projects, ideas, admin, inboxLog, goalsData, remindersData]) => {
        setStats({
          people: people.length,
          projects: projects.length,
          ideas: ideas.length,
          admin: admin.length,
          inboxLog: inboxLog.length,
          goals: goalsData.goals?.length || 0,
          reminders: remindersData.reminders?.length || 0,
        })
        setIsLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching stats:', err)
        setIsLoading(false)
      })
  }

  useEffect(() => {
    if (session) {
      fetchStats()
      const handleRefresh = () => fetchStats()
      window.addEventListener('stats:refresh', handleRefresh)
      
      // Subscribe to all data updates
      const unsubscribeAll = subscribe('all', () => {
        fetchStats()
      })
      
      return () => {
        window.removeEventListener('stats:refresh', handleRefresh)
        unsubscribeAll()
      }
    }
  }, [session, subscribe])

  // Don't show on auth pages
  const isAuthPage = pathname?.startsWith('/auth/')
  
  // Only show when authenticated and not on auth pages
  if (isAuthPage || status === 'unauthenticated' || !session) {
    return null
  }

  // All stats in order: Digest first, then others
  const allStats = [
    { title: 'Digests', value: 'View', href: '/digests' },
    { title: 'People', value: stats.people, href: '/people' },
    { title: 'Projects', value: stats.projects, href: '/projects' },
    { title: 'Ideas', value: stats.ideas, href: '/ideas' },
    { title: 'Admin', value: stats.admin, href: '/admin' },
    { title: 'Goals', value: stats.goals, href: '/goals' },
    { title: 'Reminders', value: stats.reminders, href: '/reminders' },
    { title: 'Inbox Log', value: stats.inboxLog, href: '/inbox-log' },
  ]

  // Collapsed state - show icon-only mode
  if (collapsed) {
    return (
      <aside className="w-16 flex-shrink-0 border-l border-border bg-surfaceElevated flex flex-col items-center py-4">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 rounded-lg hover:bg-surface transition-colors mb-4"
          title="Expand Stats"
          aria-label="Expand Stats"
        >
          <svg className="w-5 h-5 text-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>
      </aside>
    )
  }

  return (
    <aside className="w-64 flex-shrink-0 border-l border-border bg-surfaceElevated flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="p-3 border-b border-border/60 sticky top-0 bg-surfaceElevated z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-textMuted uppercase tracking-widest">Stats</h2>
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 rounded-lg hover:bg-surface transition-colors"
            title="Collapse Stats"
            aria-label="Collapse Stats"
          >
            <svg className="w-4 h-4 text-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats List - Vertical */}
      <div className="flex-1 p-3 space-y-2.5 overflow-y-auto">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16">
              <SkeletonCard />
            </div>
          ))
        ) : (
          allStats.map((stat) => (
            <Link key={stat.href} href={stat.href} className="block">
              <StatsCard title={stat.title} value={stat.value} />
            </Link>
          ))
        )}
      </div>
    </aside>
  )
}
