'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Email {
  id: number
  subject: string
  senderEmail: string
  senderName?: string
  receivedAt: string
  classifiedAs?: string
  linkedPersonId?: number
  linkedAdminId?: number
}

export default function EmailsPage() {
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'people' | 'projects' | 'ideas' | 'admin'>('all')

  useEffect(() => {
    fetchEmails()
  }, [filter, searchQuery])

  const fetchEmails = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) {
        params.append('q', searchQuery)
      }
      if (filter !== 'all') {
        params.append('classifiedAs', filter)
      }
      params.append('limit', '50')

      const response = await fetch(`/api/emails?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setEmails(data.emails || [])
      }
    } catch (error) {
      console.error('Error fetching emails:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSyncGmail = async () => {
    try {
      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sync: 'gmail' }),
      })
      if (response.ok) {
        setTimeout(() => fetchEmails(), 2000) // Refresh after sync
      }
    } catch (error) {
      console.error('Error syncing Gmail:', error)
    }
  }

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'people':
        return 'bg-primary/20 text-primary border border-primary/30'
      case 'projects':
        return 'bg-success/20 text-success border border-success/30'
      case 'ideas':
        return 'bg-secondary/20 text-secondary border border-secondary/30'
      case 'admin':
        return 'bg-warning/20 text-warning border border-warning/30'
      default:
        return 'bg-surface text-textMuted border border-border/60'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-textMuted font-medium italic">Loading emails...</p>
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
              Emails
            </h1>
            <p className="mt-2 text-textMuted font-medium italic">
              Capture and organize emails from Gmail/Outlook
            </p>
          </div>
          <button
            onClick={handleSyncGmail}
            className="px-4 py-2 bg-primary text-textPrimary font-bold rounded-lg hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            Sync Gmail
          </button>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search emails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 bg-surfaceElevated border border-border/60 rounded-lg text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 bg-surfaceElevated border border-border/60 rounded-lg text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          >
            <option value="all">All Categories</option>
            <option value="people">People</option>
            <option value="projects">Projects</option>
            <option value="ideas">Ideas</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {emails.length === 0 ? (
          <div className="bg-surfaceElevated border border-border/60 rounded-xl shadow-xl p-20 text-center">
            <div className="w-16 h-16 bg-surface border border-border/60 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-textMuted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-textPrimary mb-2">No Emails</h2>
            <p className="text-textMuted max-w-sm mx-auto">
              Connect Gmail integration and sync to start capturing emails.
            </p>
          </div>
        ) : (
          <div className="bg-surfaceElevated border border-border/60 rounded-xl shadow-xl overflow-hidden">
            <div className="divide-y divide-border/60">
              {emails.map((email) => (
                <div
                  key={email.id}
                  className="p-6 hover:bg-surface/50 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {email.classifiedAs && (
                          <span
                            className={`px-2 py-0.5 text-xs font-bold uppercase tracking-widest rounded-lg ${getCategoryColor(email.classifiedAs)}`}
                          >
                            {email.classifiedAs}
                          </span>
                        )}
                        <h3 className="font-bold text-textPrimary truncate">
                          {email.subject || '(No subject)'}
                        </h3>
                      </div>
                      <p className="text-sm text-textMuted mb-1">
                        From: {email.senderName || email.senderEmail} &lt;{email.senderEmail}&gt;
                      </p>
                      <p className="text-xs text-textMuted font-medium">
                        {new Date(email.receivedAt).toLocaleString()}
                      </p>
                      <div className="flex gap-3 mt-3">
                        {email.linkedPersonId && (
                          <Link
                            href={`/people/${email.linkedPersonId}`}
                            className="text-sm text-secondary hover:text-secondary/80 transition-colors font-medium"
                          >
                            View Person →
                          </Link>
                        )}
                        {email.linkedAdminId && (
                          <Link
                            href={`/admin/${email.linkedAdminId}`}
                            className="text-sm text-secondary hover:text-secondary/80 transition-colors font-medium"
                          >
                            View Task →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
