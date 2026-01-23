'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useMemo } from 'react'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

interface NavGroup {
  label: string
  items: NavItem[]
  defaultOpen?: boolean
}

interface MainNavigationProps {
  onClose?: () => void
  isMobile?: boolean
}

export default function MainNavigation({ onClose, isMobile = false }: MainNavigationProps) {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    databases: true,
    productivity: true,
    communication: true,
    automation: true,
    settings: true,
  })

  const toggleGroup = (groupKey: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }))
  }

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    // Special handling for /admin - match exactly or any admin sub-route
    if (href === '/admin') {
      return pathname === '/admin' || pathname?.startsWith('/admin/')
    }
    return pathname?.startsWith(href)
  }

  const getIcon = (iconName: string) => {
    const iconClass = 'w-5 h-5'
    switch (iconName) {
      case 'dashboard':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        )
      case 'timeline':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'calendar':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      case 'people':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        )
      case 'projects':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        )
      case 'ideas':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )
      case 'tasks':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        )
      case 'goals':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'reminders':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        )
      case 'actions':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      case 'workflows':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
      case 'emails':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )
      case 'inbox':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        )
      case 'agent':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )
      case 'integrations':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      case 'digests':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'settings':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      case 'help':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return null
    }
  }

  const navGroups: NavGroup[] = [
    {
      label: 'Core',
      items: [
        { href: '/', label: 'Dashboard', icon: getIcon('dashboard') },
        { href: '/timeline', label: 'Timeline', icon: getIcon('timeline') },
        { href: '/calendar', label: 'Calendar', icon: getIcon('calendar') },
      ],
    },
    {
      label: 'Databases',
      items: [
        { href: '/people', label: 'People', icon: getIcon('people') },
        { href: '/projects', label: 'Projects', icon: getIcon('projects') },
        { href: '/ideas', label: 'Ideas', icon: getIcon('ideas') },
        { href: '/admin', label: 'Tasks', icon: getIcon('tasks') },
      ],
    },
    {
      label: 'Productivity',
      items: [
        { href: '/goals', label: 'Goals', icon: getIcon('goals') },
        { href: '/reminders', label: 'Reminders', icon: getIcon('reminders') },
        { href: '/actions', label: 'Actions', icon: getIcon('actions') },
        { href: '/workflows', label: 'Workflows', icon: getIcon('workflows') },
      ],
    },
    {
      label: 'Communication',
      items: [
        { href: '/emails', label: 'Emails', icon: getIcon('emails') },
        { href: '/inbox-log', label: 'Inbox Log', icon: getIcon('inbox') },
      ],
    },
    {
      label: 'Automation',
      items: [
        { href: '/agent', label: 'Agent', icon: getIcon('agent') },
        { href: '/integrations', label: 'Integrations', icon: getIcon('integrations') },
        { href: '/digests', label: 'Digests', icon: getIcon('digests') },
      ],
    },
    {
      label: 'Settings',
      items: [
        { href: '/settings', label: 'Settings', icon: getIcon('settings') },
        { href: '/help', label: 'Help', icon: getIcon('help') },
      ],
    },
  ]

  // Flatten all nav items for search
  const allNavItems = useMemo(() => {
    return navGroups.flatMap(group =>
      group.items.map(item => ({ ...item, group: group.label }))
    )
  }, [])

  // Filter groups based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) {
      return navGroups
    }

    const query = searchQuery.toLowerCase()
    const filtered = navGroups.map(group => ({
      ...group,
      items: group.items.filter(item =>
        item.label.toLowerCase().includes(query) ||
        item.href.toLowerCase().includes(query)
      )
    })).filter(group => group.items.length > 0)

    return filtered
  }, [searchQuery, navGroups])

  // Highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="bg-primary/30 text-textPrimary px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  const handleItemClick = () => {
    if (isMobile && onClose) {
      onClose()
    }
  }

  return (
    <nav className="w-64 flex-shrink-0 border-r border-border bg-surfaceElevated flex flex-col overflow-y-auto h-full">
      <div className="p-4 flex flex-col h-full">
        {/* Mobile header with close button */}
        {isMobile && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-textPrimary">Navigation</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-surface transition-colors"
              aria-label="Close Navigation"
            >
              <svg className="w-5 h-5 text-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Search Input */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search navigation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchQuery('')
                }
              }}
              className="w-full px-3 py-2 pl-10 bg-surface border border-border/60 rounded-lg text-sm text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
            <svg
              className="absolute left-3 top-2.5 w-4 h-4 text-textMuted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 p-1 rounded hover:bg-surfaceElevated transition-colors"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4 text-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto space-y-1">
          {filteredGroups.length === 0 && searchQuery ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-surfaceElevated flex items-center justify-center mb-4 border border-border mx-auto">
                <svg className="w-6 h-6 text-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="font-medium text-textPrimary mb-1">No results found</p>
              <p className="text-sm text-textMuted">Try a different search term</p>
            </div>
          ) : (
            filteredGroups.map((group, groupIndex) => {
              const groupKey = group.label.toLowerCase().replace(/\s+/g, '-')
              const isOpen = openGroups[groupKey] ?? group.defaultOpen ?? true

              return (
                <div key={groupIndex} className="mb-4">
                  <button
                    onClick={() => toggleGroup(groupKey)}
                    className="w-full flex items-center justify-between px-2 py-2 text-xs font-bold text-textMuted uppercase tracking-widest hover:text-textPrimary transition-colors rounded-lg hover:bg-surface/50"
                  >
                    <span>{group.label}</span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'transform rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  {isOpen && (
                    <div className="mt-1 space-y-1">
                      {group.items.map((item) => {
                        const active = isActive(item.href)
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={handleItemClick}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                              active
                                ? 'bg-primary text-textPrimary shadow-lg shadow-primary/20'
                                : 'text-textMuted hover:bg-surface hover:text-textPrimary hover:translate-x-0.5'
                            }`}
                          >
                            {item.icon}
                            <span>{highlightText(item.label, searchQuery)}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </nav>
  )
}
