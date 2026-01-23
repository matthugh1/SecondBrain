'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import StatsCard from '@/components/StatsCard'
import TenantSwitcher from '@/components/TenantSwitcher'
import UserMenu from '@/components/UserMenu'
import { useDataUpdate } from '@/contexts/DataUpdateContext'

export default function GlobalStatsBar() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const { subscribe } = useDataUpdate()
  const [stats, setStats] = useState({
    people: 0,
    projects: 0,
    ideas: 0,
    admin: 0,
    inboxLog: 0,
    goals: 0,
    reminders: 0,
  })

  const fetchStats = () => {
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
      })
      .catch((err) => console.error('Error fetching stats:', err))
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

  return (
    <div className="bg-surface/90 backdrop-blur-md border-b border-border/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Top bar with tenant switcher and user menu */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <TenantSwitcher />
          </div>
          <UserMenu />
        </div>

        {/* Stats grid */}
        <div className="flex items-center justify-between">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-3 flex-1">
            <Link href="/people">
              <StatsCard title="People" value={stats.people} />
            </Link>
            <Link href="/projects">
              <StatsCard title="Projects" value={stats.projects} />
            </Link>
            <Link href="/ideas">
              <StatsCard title="Ideas" value={stats.ideas} />
            </Link>
            <Link href="/admin">
              <StatsCard title="Admin" value={stats.admin} />
            </Link>
            <Link href="/goals">
              <StatsCard title="Goals" value={stats.goals} />
            </Link>
            <Link href="/reminders">
              <StatsCard title="Reminders" value={stats.reminders} />
            </Link>
            <Link href="/inbox-log">
              <StatsCard title="Inbox Log" value={stats.inboxLog} />
            </Link>
            <Link href="/digests">
              <StatsCard title="Digests" value="View" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
