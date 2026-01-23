'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import ChatInterface from '@/components/ChatInterface'
import QuickTaskCapture from '@/components/QuickTaskCapture'
import MainNavigation from '@/components/MainNavigation'
import GlobalStatsBar from '@/components/GlobalStatsBar'
import KeyboardShortcuts from '@/components/KeyboardShortcuts'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { useKeyboardShortcuts } from '@/lib/hooks/useKeyboardShortcuts'

export default function LayoutWithChat({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isMobile = useMediaQuery('(max-width: 1023px)')
  const [mounted, setMounted] = useState(false)
  const [navOpen, setNavOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatCollapsed, setChatCollapsed] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  // Handle client-side mounting to avoid hydration issues
  useEffect(() => {
    setMounted(true)
    // Set initial state based on screen size
    if (typeof window !== 'undefined') {
      const isMobileScreen = window.innerWidth < 1024
      setNavOpen(!isMobileScreen)
      setChatOpen(!isMobileScreen)
    }
  }, [])

  // Load chat collapsed preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chatCollapsed')
      if (saved !== null) {
        setChatCollapsed(JSON.parse(saved))
      }
    }
  }, [])

  // Save chat collapsed preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('chatCollapsed', JSON.stringify(chatCollapsed))
    }
  }, [chatCollapsed])

  // Update nav/chat state when switching between mobile/desktop
  useEffect(() => {
    if (mounted) {
      if (isMobile) {
        setNavOpen(false)
        setChatOpen(false)
      } else {
        setNavOpen(true)
        setChatOpen(true)
      }
    }
  }, [isMobile, mounted])

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrlKey: true,
      handler: () => {
        // Focus navigation search if available
        const searchInput = document.querySelector('input[placeholder*="Search navigation"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
        }
      },
      description: 'Focus navigation search',
    },
    {
      key: 'b',
      ctrlKey: true,
      handler: () => {
        if (isMobile) {
          setNavOpen(!navOpen)
        }
      },
      description: 'Toggle navigation',
    },
    {
      key: 'j',
      ctrlKey: true,
      handler: () => {
        if (isMobile) {
          setChatOpen(!chatOpen)
        } else {
          setChatCollapsed(!chatCollapsed)
        }
      },
      description: 'Toggle chat',
    },
    {
      key: '?',
      handler: () => {
        setShowShortcuts(true)
      },
      description: 'Show keyboard shortcuts',
      preventDefault: true,
    },
    {
      key: 'Escape',
      handler: () => {
        if (showShortcuts) {
          setShowShortcuts(false)
        } else if (isMobile) {
          setNavOpen(false)
          setChatOpen(false)
        }
      },
      description: 'Close drawers or modals',
    },
  ])

  // Exclude chat from auth pages
  const isAuthPage = pathname?.startsWith('/auth')

  if (isAuthPage) {
    return <>{children}</>
  }

  // Don't render responsive layout until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="flex flex-1 overflow-hidden bg-background">
        <MainNavigation />
        <div className="w-[32rem] flex-shrink-0 border-r border-border bg-surface flex flex-col p-4">
          <div className="flex-1 flex flex-col min-h-0">
            <ChatInterface />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-background">
          {children}
        </div>
        <QuickTaskCapture />
      </div>
    )
  }

  return (
    <div className="flex flex-1 overflow-hidden bg-background">
      {/* Mobile overlay backdrop */}
      {isMobile && (navOpen || chatOpen) && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm lg:hidden"
          style={{ top: '3.5rem', height: 'calc(100vh - 3.5rem)' }}
          onClick={() => {
            setNavOpen(false)
            setChatOpen(false)
          }}
        />
      )}

      {/* Main Navigation Sidebar */}
      <aside
        className={`
          ${isMobile
            ? `fixed left-0 h-full z-50 transform transition-transform duration-300 ease-in-out ${
                navOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : 'relative'
          }
          w-64 flex-shrink-0 border-r border-border bg-surfaceElevated
        `}
        style={isMobile ? { top: '3.5rem', height: 'calc(100vh - 3.5rem)' } : undefined}
      >
        <MainNavigation onClose={() => setNavOpen(false)} isMobile={isMobile} />
      </aside>

      {/* Chat Sidebar */}
      {!isMobile && (
        <aside
          className={`
            ${chatCollapsed ? 'w-16' : 'w-[32rem]'}
            flex-shrink-0 border-r border-border bg-surface flex flex-col transition-all duration-300 ease-in-out
          `}
        >
          {chatCollapsed ? (
            <div className="p-4 flex flex-col items-center gap-4 h-full">
              <button
                onClick={() => setChatCollapsed(false)}
                className="p-2 rounded-lg hover:bg-surfaceElevated transition-colors"
                title="Expand Chat"
                aria-label="Expand Chat"
              >
                <svg className="w-6 h-6 text-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 p-4 relative">
              <button
                onClick={() => setChatCollapsed(true)}
                className="absolute top-4 right-4 z-10 p-1 rounded-lg hover:bg-surfaceElevated transition-colors"
                title="Collapse Chat"
                aria-label="Collapse Chat"
              >
                <svg className="w-5 h-5 text-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex-1 flex flex-col min-h-0">
                <ChatInterface />
              </div>
            </div>
          )}
        </aside>
      )}

      {/* Mobile Chat Drawer */}
      {isMobile && (
        <aside
          className={`
            fixed right-0 h-full z-50 transform transition-transform duration-300 ease-in-out ${
              chatOpen ? 'translate-x-0' : 'translate-x-full'
            }
            w-[90vw] max-w-md flex-shrink-0 border-l border-border bg-surface flex flex-col
          `}
          style={{ top: '3.5rem', height: 'calc(100vh - 3.5rem)' }}
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-xl font-bold text-textPrimary">Capture Thoughts</h2>
            <button
              onClick={() => setChatOpen(false)}
              className="p-1 rounded-lg hover:bg-surfaceElevated transition-colors"
              aria-label="Close Chat"
            >
              <svg className="w-5 h-5 text-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-1 flex flex-col min-h-0 p-4 overflow-hidden">
            <ChatInterface />
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background">
        {/* Mobile header with hamburger menu */}
        {isMobile && (
          <div className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border flex items-center justify-between px-4 py-3 lg:hidden" style={{ top: '3.5rem' }}>
            <button
              onClick={() => setNavOpen(true)}
              className="p-2 rounded-lg hover:bg-surfaceElevated transition-colors"
              aria-label="Open Navigation"
            >
              <svg className="w-6 h-6 text-textPrimary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setChatOpen(true)}
              className="p-2 rounded-lg hover:bg-surfaceElevated transition-colors relative"
              aria-label="Open Chat"
            >
              <svg className="w-6 h-6 text-textPrimary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
          </div>
        )}
        {children}
      </main>

      {/* Stats Panel - Fixed Vertical Panel on Right */}
      {!isMobile && <GlobalStatsBar />}

      {/* Quick Task Capture */}
      <QuickTaskCapture />

      {/* Keyboard Shortcuts Overlay */}
      <KeyboardShortcuts isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  )
}
