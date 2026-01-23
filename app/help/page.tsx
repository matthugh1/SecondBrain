'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface HelpSection {
  id: string
  title: string
  subsections?: { id: string; title: string }[]
}

const helpSections: HelpSection[] = [
  { id: 'getting-started', title: 'Getting Started' },
  { id: 'chat-interface', title: 'Chat Interface' },
  { id: 'dashboard', title: 'Dashboard' },
  { id: 'database-views', title: 'Database Views' },
  { id: 'item-details', title: 'Item Detail Pages' },
  { id: 'inbox-log', title: 'Inbox Log' },
  { id: 'timeline', title: 'Timeline' },
  { id: 'calendar', title: 'Calendar' },
  { id: 'tags', title: 'Tags' },
  { id: 'goals', title: 'Goals' },
  { id: 'reminders', title: 'Reminders' },
  { id: 'workflows', title: 'Workflows' },
  { id: 'actions', title: 'Actions' },
  { id: 'agent', title: 'Autonomous Agent' },
  { id: 'digests', title: 'Digests & Reviews' },
  { id: 'predictions', title: 'Predictions' },
  { id: 'patterns', title: 'Pattern Detection' },
  { id: 'integrations', title: 'Integrations' },
  { id: 'admin-features', title: 'Admin Features' },
  { id: 'settings', title: 'Settings & Configuration' },
  { id: 'relationships', title: 'Relationships' },
  { id: 'comments', title: 'Comments' },
  { id: 'attachments', title: 'Attachments' },
  { id: 'undo-redo', title: 'Undo & Redo' },
  { id: 'saved-searches', title: 'Saved Searches' },
  { id: 'query-engine', title: 'Query Engine' },
  { id: 'tips', title: 'Tips & Best Practices' },
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['getting-started']))
  const [highlightedText, setHighlightedText] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (searchQuery) {
      setHighlightedText(searchQuery)
    } else {
      setHighlightedText('')
    }
  }, [searchQuery])

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const highlightText = (text: string): string => {
    if (!highlightedText) return text
    const regex = new RegExp(`(${highlightedText})`, 'gi')
    return text.replace(regex, '<mark class="bg-secondary/30 text-secondary px-0.5 rounded">$1</mark>')
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setExpandedSections((prev) => new Set(prev).add(sectionId))
    }
  }

  const filteredSections = helpSections.filter((section) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      section.title.toLowerCase().includes(query) ||
      section.id.toLowerCase().includes(query)
    )
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
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
          <h1 className="text-4xl font-black text-textPrimary tracking-tight mb-2">
            User Guide
          </h1>
          <p className="text-textMuted font-medium italic">
            Complete guide to using Second Brain
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search help topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-surfaceElevated border border-border/60 rounded-xl text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-textMuted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  searchInputRef.current?.focus()
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-textMuted hover:text-textPrimary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Table of Contents Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="sticky top-4 bg-surfaceElevated border border-border/60 rounded-xl p-4">
              <h2 className="text-sm font-bold text-textPrimary uppercase tracking-widest mb-4">
                Table of Contents
              </h2>
              <nav className="space-y-1">
                {helpSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`block w-full text-left px-3 py-2 text-sm rounded-lg transition-all ${
                      filteredSections.some((s) => s.id === section.id)
                        ? 'text-textPrimary hover:bg-surface hover:text-primary'
                        : 'text-textMuted opacity-50'
                    }`}
                  >
                    {section.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 space-y-8">
            {/* Getting Started */}
            <section id="getting-started" className="scroll-mt-4">
              <div className="bg-surfaceElevated border border-border/60 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-black text-textPrimary mb-4 flex items-center gap-2">
                  <span className="text-primary">01</span>
                  Getting Started
                </h2>
                <div className="prose prose-invert max-w-none text-textPrimary space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Introduction to Second Brain</h3>
                    <p className="text-textMuted">
                      Second Brain is a personal knowledge management system that helps you capture, organize, and manage your thoughts, tasks, projects, and ideas. The system uses AI to automatically classify your captures into organized databases, making it easy to find and manage information.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">First-Time Setup</h3>
                    <ol className="list-decimal list-inside space-y-2 text-textMuted ml-4">
                      <li>Sign up for an account using the "Initialize" button</li>
                      <li>Complete your profile setup</li>
                      <li>Configure your workspace settings (optional)</li>
                      <li>Start capturing your first thought using the chat interface</li>
                    </ol>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Navigation Overview</h3>
                    <p className="text-textMuted mb-2">
                      The main navigation is located at the top of the page:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li><strong className="text-textPrimary">Dashboard</strong> - Your home page with quick access to all features</li>
                      <li><strong className="text-textPrimary">Stats Cards</strong> - Quick view of People, Projects, Ideas, Admin tasks, Inbox Log, and Digests</li>
                      <li><strong className="text-textPrimary">Settings</strong> - Configure your workspace and preferences</li>
                      <li><strong className="text-textPrimary">Help</strong> - Access this user guide</li>
                      <li><strong className="text-textPrimary">Signal Out</strong> - Sign out of your account</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Basic Concepts</h3>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-bold text-textPrimary">Databases</h4>
                        <p className="text-textMuted">
                          Your information is organized into four main databases:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-textMuted ml-4 mt-1">
                          <li><strong className="text-textPrimary">People</strong> - Contacts, relationships, and follow-ups</li>
                          <li><strong className="text-textPrimary">Projects</strong> - Active projects with status tracking</li>
                          <li><strong className="text-textPrimary">Ideas</strong> - Ideas, concepts, and future possibilities</li>
                          <li><strong className="text-textPrimary">Admin</strong> - Tasks, to-dos, and administrative items</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-bold text-textPrimary">AI Classification</h4>
                        <p className="text-textMuted">
                          When you capture a thought, the AI automatically analyzes it and classifies it into the appropriate database. You can review and fix classifications in the Inbox Log.
                        </p>
                      </div>
                      <div>
                        <h4 className="font-bold text-textPrimary">Capture</h4>
                        <p className="text-textMuted">
                          Capture is the process of adding new information to your Second Brain. You can capture via text, voice, or integrations.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Chat Interface */}
            <section id="chat-interface" className="scroll-mt-4">
              <div className="bg-surfaceElevated border border-border/60 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-black text-textPrimary mb-4 flex items-center gap-2">
                  <span className="text-primary">02</span>
                  Chat Interface
                </h2>
                <div className="prose prose-invert max-w-none text-textPrimary space-y-4">
                  <p className="text-textMuted">
                    The chat interface is your primary way to capture thoughts and interact with Second Brain. It's located on the left side of the screen (or top on mobile).
                  </p>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Text Capture</h3>
                    <ol className="list-decimal list-inside space-y-2 text-textMuted ml-4">
                      <li>Type your thought in the chat input field</li>
                      <li>Press Enter or click the Send button</li>
                      <li>The system will automatically classify your capture</li>
                      <li>You'll see a confirmation with the classification result</li>
                    </ol>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Voice Capture</h3>
                    <p className="text-textMuted mb-2">
                      You can use voice input for hands-free capture:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-textMuted ml-4">
                      <li>Click the microphone icon in the chat input</li>
                      <li>Speak your thought clearly</li>
                      <li>The system will transcribe and automatically submit</li>
                      <li>Voice capture works best in quiet environments</li>
                    </ol>
                    <p className="text-textMuted mt-2 text-sm italic">
                      Note: Voice capture requires browser microphone permissions and works best in Chrome/Edge.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Natural Language Queries</h3>
                    <p className="text-textMuted mb-2">
                      You can ask questions in natural language:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li>"Show me all projects that are blocked"</li>
                      <li>"What tasks are due this week?"</li>
                      <li>"Find all items related to John"</li>
                      <li>"Show me ideas from last month"</li>
                    </ul>
                    <p className="text-textMuted mt-2">
                      The query engine understands context and will search across all your databases.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Capture Predictions</h3>
                    <p className="text-textMuted">
                      As you type, the system may show predictions for what you're about to capture. These are based on your past captures and can help speed up data entry.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Smart Autocomplete</h3>
                    <p className="text-textMuted">
                      The chat interface includes smart autocomplete that suggests completions based on your capture history and patterns.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Dashboard */}
            <section id="dashboard" className="scroll-mt-4">
              <div className="bg-surfaceElevated border border-border/60 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-black text-textPrimary mb-4 flex items-center gap-2">
                  <span className="text-primary">03</span>
                  Dashboard
                </h2>
                <div className="prose prose-invert max-w-none text-textPrimary space-y-4">
                  <p className="text-textMuted">
                    The Dashboard is your home page and provides an overview of your Second Brain with quick access to key features.
                  </p>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Global Search</h3>
                    <p className="text-textMuted">
                      The global search bar at the top allows you to search across all databases simultaneously. Type your query and press Enter to see results from People, Projects, Ideas, and Admin tasks.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Quick Links</h3>
                    <p className="text-textMuted mb-2">
                      Quick action buttons provide fast access to:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li><strong className="text-textPrimary">View Timeline</strong> - See chronological view of all captures</li>
                      <li><strong className="text-textPrimary">Calendar</strong> - Access your calendar view</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Saved Searches</h3>
                    <p className="text-textMuted">
                      Save frequently used search queries for quick access. Click on a saved search to instantly run that query.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Action Suggestions</h3>
                    <p className="text-textMuted">
                      The system suggests actions you might want to take based on your data, such as following up with people or updating project statuses.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Pattern Recommendations</h3>
                    <p className="text-textMuted">
                      AI-powered pattern detection suggests relationships, tags, or actions based on patterns in your captures.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Database Views */}
            <section id="database-views" className="scroll-mt-4">
              <div className="bg-surfaceElevated border border-border/60 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-black text-textPrimary mb-4 flex items-center gap-2">
                  <span className="text-primary">04</span>
                  Database Views
                </h2>
                <div className="prose prose-invert max-w-none text-textPrimary space-y-4">
                  <p className="text-textMuted">
                    Each database (People, Projects, Ideas, Admin) has its own view page where you can browse, filter, and manage items.
                  </p>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">People Database</h3>
                    <p className="text-textMuted mb-2">
                      The People database stores information about contacts and relationships:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li><strong className="text-textPrimary">Name</strong> - Person's name</li>
                      <li><strong className="text-textPrimary">Context</strong> - Background information</li>
                      <li><strong className="text-textPrimary">Follow-ups</strong> - Notes about follow-up actions</li>
                      <li><strong className="text-textPrimary">Last Touched</strong> - Date of last interaction</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Projects Database</h3>
                    <p className="text-textMuted mb-2">
                      Track your active and completed projects:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li><strong className="text-textPrimary">Name</strong> - Project name</li>
                      <li><strong className="text-textPrimary">Status</strong> - Active, Waiting, Blocked, Someday, or Done</li>
                      <li><strong className="text-textPrimary">Next Action</strong> - What to do next</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Ideas Database</h3>
                    <p className="text-textMuted mb-2">
                      Capture and organize your ideas:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li><strong className="text-textPrimary">Name</strong> - Idea title</li>
                      <li><strong className="text-textPrimary">One-Liner</strong> - Brief description</li>
                      <li><strong className="text-textPrimary">Last Touched</strong> - When you last reviewed it</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Admin (Tasks) Database</h3>
                    <p className="text-textMuted mb-2">
                      Manage your tasks and to-dos:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li><strong className="text-textPrimary">Priority</strong> - Urgent, High, Medium, or Low</li>
                      <li><strong className="text-textPrimary">Name</strong> - Task name</li>
                      <li><strong className="text-textPrimary">Status</strong> - Todo, In Progress, Blocked, Waiting, Done, or Cancelled</li>
                      <li><strong className="text-textPrimary">Start Date</strong> - When the task starts</li>
                      <li><strong className="text-textPrimary">Due Date</strong> - When the task is due</li>
                      <li><strong className="text-textPrimary">Project</strong> - Associated project ID</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Filtering & Sorting</h3>
                    <p className="text-textMuted">
                      Use the filter controls at the top of each database view to filter by status, date range, tags, or search terms. Click column headers to sort.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Inline Editing</h3>
                    <p className="text-textMuted">
                      Click on any cell in the table to edit it directly. Changes are saved automatically. Some fields have dropdown menus for quick selection.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Item Detail Pages */}
            <section id="item-details" className="scroll-mt-4">
              <div className="bg-surfaceElevated border border-border/60 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-black text-textPrimary mb-4 flex items-center gap-2">
                  <span className="text-primary">05</span>
                  Item Detail Pages
                </h2>
                <div className="prose prose-invert max-w-none text-textPrimary space-y-4">
                  <p className="text-textMuted">
                    Click on any item in a database view to see its detailed page with full information and related features.
                  </p>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Viewing Item Details</h3>
                    <p className="text-textMuted">
                      The detail page shows all fields for the item, including notes, dates, tags, and relationships.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Editing Items</h3>
                    <p className="text-textMuted">
                      Click the edit button or click directly on fields to modify them. Rich text editing is available for notes fields.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Related Items</h3>
                    <p className="text-textMuted">
                      See items that are related to the current item through relationships or shared tags.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Comments</h3>
                    <p className="text-textMuted">
                      Add comments to items for additional context, notes, or collaboration with team members.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Attachments</h3>
                    <p className="text-textMuted">
                      Attach files, images, or documents to items. Supported formats include PDF, images, and common document types.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Tags</h3>
                    <p className="text-textMuted">
                      Add tags to items for better organization. Tags can be used for filtering and searching.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Inbox Log */}
            <section id="inbox-log" className="scroll-mt-4">
              <div className="bg-surfaceElevated border border-border/60 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-black text-textPrimary mb-4 flex items-center gap-2">
                  <span className="text-primary">06</span>
                  Inbox Log
                </h2>
                <div className="prose prose-invert max-w-none text-textPrimary space-y-4">
                  <p className="text-textMuted">
                      The Inbox Log is an audit trail of all captures, showing the complete history of what you've added to Second Brain.
                    </p>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Viewing Capture History</h3>
                    <p className="text-textMuted">
                      The Inbox Log displays all captures in chronological order, showing the original message, classification result, and timestamp.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Fixing Misclassifications</h3>
                    <p className="text-textMuted mb-2">
                      If an item was classified incorrectly:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-textMuted ml-4">
                      <li>Find the item in the Inbox Log</li>
                      <li>Click the "Fix" button</li>
                      <li>Select the correct category</li>
                      <li>The item will be moved to the correct database</li>
                    </ol>
                    <p className="text-textMuted mt-2">
                      The system learns from your corrections to improve future classifications.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Review Process</h3>
                    <p className="text-textMuted">
                      Items marked as "Needs Review" require your attention. Review them to ensure proper classification and completeness.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Filtering Inbox Log</h3>
                    <p className="text-textMuted">
                      Filter the inbox log by category, date range, or search terms to find specific captures.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Timeline */}
            <section id="timeline" className="scroll-mt-4">
              <div className="bg-surfaceElevated border border-border/60 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-black text-textPrimary mb-4 flex items-center gap-2">
                  <span className="text-primary">07</span>
                  Timeline
                </h2>
                <div className="prose prose-invert max-w-none text-textPrimary space-y-4">
                  <p className="text-textMuted">
                    The Timeline provides a chronological view of all your captures, organized by date.
                  </p>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Viewing Timeline</h3>
                    <p className="text-textMuted">
                      Items are grouped by date, with the most recent at the top. Click on any item to view its details.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Filtering Timeline</h3>
                    <p className="text-textMuted mb-2">
                      Filter the timeline by:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li><strong className="text-textPrimary">Type</strong> - Show only People, Projects, Ideas, or Admin</li>
                      <li><strong className="text-textPrimary">Tags</strong> - Filter by specific tags</li>
                      <li><strong className="text-textPrimary">Date Range</strong> - Select start and end dates</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Timeline Benefits</h3>
                    <p className="text-textMuted">
                      Use the timeline to review your activity over time, identify patterns, and see the evolution of your projects and ideas.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Calendar */}
            <section id="calendar" className="scroll-mt-4">
              <div className="bg-surfaceElevated border border-border/60 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-black text-textPrimary mb-4 flex items-center gap-2">
                  <span className="text-primary">08</span>
                  Calendar
                </h2>
                <div className="prose prose-invert max-w-none text-textPrimary space-y-4">
                  <p className="text-textMuted">
                    The Calendar view shows your week in a visual timeline format, synced with your connected calendar services.
                  </p>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Week View</h3>
                    <p className="text-textMuted">
                      The calendar displays a week at a time, with each day showing hourly slots. Events are displayed as blocks showing their duration.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Navigation</h3>
                    <p className="text-textMuted mb-2">
                      Use the navigation controls to:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li>Move to previous/next week</li>
                      <li>Jump to today's date</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Current Meeting Highlight</h3>
                    <p className="text-textMuted">
                      Meetings happening right now are highlighted with a special color and border for easy identification.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Calendar Sync</h3>
                    <p className="text-textMuted mb-2">
                      Connect your Google Calendar or other calendar services to automatically sync events:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-textMuted ml-4">
                      <li>Go to Settings → Integrations</li>
                      <li>Connect your calendar provider</li>
                      <li>Events will sync automatically</li>
                    </ol>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Event Details</h3>
                    <p className="text-textMuted">
                      Hover over events to see details like location, attendees, and description. Click to view full event information.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Tags */}
            <section id="tags" className="scroll-mt-4">
              <div className="bg-surfaceElevated border border-border/60 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-black text-textPrimary mb-4 flex items-center gap-2">
                  <span className="text-primary">09</span>
                  Tags
                </h2>
                <div className="prose prose-invert max-w-none text-textPrimary space-y-4">
                  <p className="text-textMuted">
                    Tags help you organize and categorize items across all databases for easier searching and filtering.
                  </p>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Adding Tags</h3>
                    <p className="text-textMuted mb-2">
                      Add tags to any item:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-textMuted ml-4">
                      <li>Open an item's detail page</li>
                      <li>Click in the Tags field</li>
                      <li>Type tag names separated by spaces</li>
                      <li>Press Enter to save</li>
                    </ol>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Filtering by Tags</h3>
                    <p className="text-textMuted">
                      Use tags in filters to find all items with specific tags across databases. Tags work as a cross-database organization system.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Tag Best Practices</h3>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li>Use consistent naming conventions</li>
                      <li>Keep tags short and descriptive</li>
                      <li>Use tags for cross-cutting concerns (e.g., "urgent", "client-work")</li>
                      <li>Don't over-tag - use 3-5 tags per item maximum</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Goals */}
            <section id="goals" className="scroll-mt-4">
              <div className="bg-surfaceElevated border border-border/60 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-black text-textPrimary mb-4 flex items-center gap-2">
                  <span className="text-primary">10</span>
                  Goals
                </h2>
                <div className="prose prose-invert max-w-none text-textPrimary space-y-4">
                  <p className="text-textMuted">
                    Track your progress toward objectives and goals with the Goals feature.
                  </p>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Creating Goals</h3>
                    <ol className="list-decimal list-inside space-y-2 text-textMuted ml-4">
                      <li>Go to the Goals page</li>
                      <li>Click "New Goal"</li>
                      <li>Enter goal name and description</li>
                      <li>Set a target date (optional)</li>
                      <li>Choose progress method (Manual or Auto from Linked Items)</li>
                      <li>Click Create</li>
                    </ol>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Tracking Progress</h3>
                    <p className="text-textMuted mb-2">
                      Update progress manually or automatically:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li><strong className="text-textPrimary">Manual</strong> - Update progress percentage yourself</li>
                      <li><strong className="text-textPrimary">Auto from Linked Items</strong> - Progress calculated from linked tasks/projects</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Linking Items</h3>
                    <p className="text-textMuted">
                      Link projects, tasks, or other items to goals to track how they contribute to your objectives.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Goal Status</h3>
                    <p className="text-textMuted mb-2">
                      Goals can have different statuses:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li><strong className="text-textPrimary">Active</strong> - Currently working on</li>
                      <li><strong className="text-textPrimary">Completed</strong> - Goal achieved</li>
                      <li><strong className="text-textPrimary">Paused</strong> - Temporarily on hold</li>
                      <li><strong className="text-textPrimary">Cancelled</strong> - No longer pursuing</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Filtering Goals</h3>
                    <p className="text-textMuted">
                      Filter goals by status (All, Active, Completed, Paused) to focus on what matters most.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Reminders */}
            <section id="reminders" className="scroll-mt-4">
              <div className="bg-surfaceElevated border border-border/60 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-black text-textPrimary mb-4 flex items-center gap-2">
                  <span className="text-primary">11</span>
                  Reminders
                </h2>
                <div className="prose prose-invert max-w-none text-textPrimary space-y-4">
                  <p className="text-textMuted">
                    Reminders help you stay on top of important items, follow-ups, and deadlines. They're automatically generated based on your data.
                  </p>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Reminder Types</h3>
                    <ul className="list-disc list-inside space-y-2 text-textMuted ml-4">
                      <li><strong className="text-textPrimary">Due Dates</strong> - Tasks approaching their due date</li>
                      <li><strong className="text-textPrimary">Follow-Ups</strong> - People you haven't contacted in a while</li>
                      <li><strong className="text-textPrimary">Stale Items</strong> - Items that haven't been updated recently</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Managing Reminders</h3>
                    <p className="text-textMuted mb-2">
                      For each reminder, you can:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li><strong className="text-textPrimary">Snooze</strong> - Delay the reminder for 24 hours</li>
                      <li><strong className="text-textPrimary">Mark Done</strong> - Complete the reminder</li>
                      <li><strong className="text-textPrimary">Dismiss</strong> - Remove the reminder</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Reminder Priority</h3>
                    <p className="text-textMuted mb-2">
                      Reminders are prioritized as:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li><strong className="text-textPrimary">High</strong> - Urgent items requiring immediate attention</li>
                      <li><strong className="text-textPrimary">Medium</strong> - Important but not urgent</li>
                      <li><strong className="text-textPrimary">Low</strong> - Nice to have reminders</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Filtering Reminders</h3>
                    <p className="text-textMuted">
                      Filter reminders by type (All, Due Dates, Follow-Ups, Stale Items) to focus on specific categories.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Workflows */}
            <section id="workflows" className="scroll-mt-4">
              <div className="bg-surfaceElevated border border-border/60 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-black text-textPrimary mb-4 flex items-center gap-2">
                  <span className="text-primary">12</span>
                  Workflows
                </h2>
                <div className="prose prose-invert max-w-none text-textPrimary space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">What Are Workflows?</h3>
                    <p className="text-textMuted mb-2">
                      Workflows are automated sequences of actions that run when specific conditions (triggers) are met. They help you automate repetitive tasks and maintain consistency in your Second Brain.
                    </p>
                    <p className="text-textMuted">
                      For example, you could create a workflow that automatically sends a reminder when a task is due tomorrow, or one that archives completed projects after they've been done for a week. Workflows run automatically in the background, saving you time and ensuring important actions aren't forgotten.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Workflow Components</h3>
                    <p className="text-textMuted mb-2">
                      Every workflow consists of:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-textMuted ml-4">
                      <li><strong className="text-textPrimary">Trigger</strong> - The event or condition that starts the workflow (e.g., item created, status changed, scheduled time)</li>
                      <li><strong className="text-textPrimary">Actions</strong> - What happens when the trigger fires (e.g., update item, send notification, create reminder)</li>
                      <li><strong className="text-textPrimary">Priority</strong> - Execution order when multiple workflows could run (higher priority runs first)</li>
                      <li><strong className="text-textPrimary">Enabled/Disabled</strong> - Toggle to activate or deactivate the workflow</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Trigger Types</h3>
                    <p className="text-textMuted mb-2">
                      Workflows can be triggered by:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li><strong className="text-textPrimary">item_created</strong> - When a new item is created</li>
                      <li><strong className="text-textPrimary">item_updated</strong> - When an existing item is modified</li>
                      <li><strong className="text-textPrimary">item_deleted</strong> - When an item is deleted</li>
                      <li><strong className="text-textPrimary">status_changed</strong> - When an item's status changes</li>
                      <li><strong className="text-textPrimary">scheduled</strong> - At a specific time (daily, weekly, monthly)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Action Types</h3>
                    <p className="text-textMuted mb-2">
                      Available actions include:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li><strong className="text-textPrimary">create</strong> - Create new items</li>
                      <li><strong className="text-textPrimary">update</strong> - Modify existing items</li>
                      <li><strong className="text-textPrimary">delete</strong> - Remove items</li>
                      <li><strong className="text-textPrimary">notify</strong> - Send notifications</li>
                      <li><strong className="text-textPrimary">schedule</strong> - Schedule reminders</li>
                      <li><strong className="text-textPrimary">link</strong> - Create relationships between items</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Creating Workflows</h3>
                    <p className="text-textMuted mb-2">
                      Workflows are created using JSON configuration. You can create them via the API or use templates from Admin settings. Here are example workflow configurations:
                    </p>
                    
                    <div className="mt-4 space-y-4">
                      <div>
                        <h4 className="font-bold text-textPrimary mb-2">Example 1: Remind Before Due Date</h4>
                        <p className="text-textMuted text-sm mb-2">
                          This workflow sends a reminder daily at 9 AM for tasks due tomorrow.
                        </p>
                        <pre className="bg-background border border-border/60 rounded-lg p-4 text-sm text-textMuted overflow-x-auto">
{`{
  "name": "Remind Before Due Date",
  "description": "Send reminder for admin tasks due tomorrow",
  "trigger": {
    "type": "scheduled",
    "schedule": {
      "frequency": "daily",
      "time": "09:00"
    }
  },
  "actions": [
    {
      "actionType": "schedule",
      "parameters": {
        "reminderType": "due_date",
        "title": "Task Due Tomorrow",
        "message": "You have tasks due tomorrow"
      }
    }
  ],
  "priority": 0,
  "enabled": true
}`}
                        </pre>
                      </div>

                      <div>
                        <h4 className="font-bold text-textPrimary mb-2">Example 2: Archive Completed Projects</h4>
                        <p className="text-textMuted text-sm mb-2">
                          This workflow automatically archives projects when their status changes to "Done".
                        </p>
                        <pre className="bg-background border border-border/60 rounded-lg p-4 text-sm text-textMuted overflow-x-auto">
{`{
  "name": "Archive Completed Projects",
  "description": "Automatically archive projects after they are marked as Done",
  "trigger": {
    "type": "status_changed",
    "itemType": "projects",
    "conditions": [
      {
        "field": "status",
        "operator": "equals",
        "value": "Done"
      }
    ]
  },
  "actions": [
    {
      "actionType": "update",
      "targetType": "projects",
      "parameters": {
        "archived": 1
      }
    }
  ],
  "priority": 0,
  "enabled": true
}`}
                        </pre>
                      </div>

                      <div>
                        <h4 className="font-bold text-textPrimary mb-2">Example 3: Notify on High Priority Task</h4>
                        <p className="text-textMuted text-sm mb-2">
                          This workflow sends a notification when a high-priority admin task is created.
                        </p>
                        <pre className="bg-background border border-border/60 rounded-lg p-4 text-sm text-textMuted overflow-x-auto">
{`{
  "name": "Notify on High Priority Task",
  "description": "Get notified when urgent tasks are created",
  "trigger": {
    "type": "item_created",
    "itemType": "admin",
    "conditions": [
      {
        "field": "priority",
        "operator": "equals",
        "value": "urgent"
      }
    ]
  },
  "actions": [
    {
      "actionType": "notify",
      "parameters": {
        "title": "Urgent Task Created",
        "message": "A new urgent task has been added to your list"
      }
    }
  ],
  "priority": 10,
  "enabled": true
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Creating via API</h3>
                    <p className="text-textMuted mb-2">
                      To create a workflow via API, send a POST request to <code className="bg-background px-1 py-0.5 rounded text-textPrimary">/api/workflows</code> with the JSON configuration:
                    </p>
                    <pre className="bg-background border border-border/60 rounded-lg p-4 text-sm text-textMuted overflow-x-auto">
{`POST /api/workflows
Content-Type: application/json

{
  "name": "Your Workflow Name",
  "description": "Optional description",
  "trigger": { /* trigger config */ },
  "actions": [ /* actions array */ ],
  "priority": 0,
  "enabled": true
}`}
                    </pre>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Enabling/Disabling</h3>
                    <p className="text-textMuted">
                      Toggle workflows on or off as needed. Disabled workflows won't execute but remain saved for later use. This is useful for temporarily pausing automation without deleting the workflow.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Workflow Execution</h3>
                    <p className="text-textMuted mb-2">
                      View execution history to see when workflows ran and what actions they performed. Each workflow tracks:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li>Execution count - How many times it has run</li>
                      <li>Last executed - When it last ran</li>
                      <li>Status - Success, failed, or skipped</li>
                    </ul>
                    <p className="text-textMuted mt-2">
                      This helps you monitor and debug workflows to ensure they're working as expected.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Actions */}
            <section id="actions" className="scroll-mt-4">
              <div className="bg-surfaceElevated border border-border/60 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-black text-textPrimary mb-4 flex items-center gap-2">
                  <span className="text-primary">13</span>
                  Actions
                </h2>
                <div className="prose prose-invert max-w-none text-textPrimary space-y-4">
                  <p className="text-textMuted">
                    The Actions page shows system actions that require approval or have been executed, providing transparency and control.
                  </p>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Action Types</h3>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li><strong className="text-textPrimary">Create</strong> - Create new items</li>
                      <li><strong className="text-textPrimary">Update</strong> - Modify existing items</li>
                      <li><strong className="text-textPrimary">Delete</strong> - Remove items</li>
                      <li><strong className="text-textPrimary">Link</strong> - Create relationships</li>
                      <li><strong className="text-textPrimary">Notify</strong> - Send notifications</li>
                      <li><strong className="text-textPrimary">Schedule</strong> - Schedule reminders</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Approval Process</h3>
                    <p className="text-textMuted mb-2">
                      Some actions require approval before execution:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-textMuted ml-4">
                      <li>Review pending actions</li>
                      <li>Click "Approve" to allow execution</li>
                      <li>Or click "Reject" to cancel</li>
                      <li>Approved actions execute immediately</li>
                    </ol>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Action Status</h3>
                    <p className="text-textMuted mb-2">
                      Actions can have different statuses:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li><strong className="text-textPrimary">Pending</strong> - Awaiting approval</li>
                      <li><strong className="text-textPrimary">Approved</strong> - Approved but not yet executed</li>
                      <li><strong className="text-textPrimary">Executing</strong> - Currently running</li>
                      <li><strong className="text-textPrimary">Executed</strong> - Successfully completed</li>
                      <li><strong className="text-textPrimary">Rejected</strong> - Cancelled by user</li>
                      <li><strong className="text-textPrimary">Failed</strong> - Execution error</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Rollback</h3>
                    <p className="text-textMuted">
                      For executed actions, you can rollback to undo the changes. This is useful if an action had unintended consequences.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Filtering Actions</h3>
                    <p className="text-textMuted">
                      Filter actions by status (All, Pending, Executed, Failed) to focus on what needs attention.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Agent */}
            <section id="agent" className="scroll-mt-4">
              <div className="bg-surfaceElevated border border-border/60 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-black text-textPrimary mb-4 flex items-center gap-2">
                  <span className="text-primary">14</span>
                  Autonomous Agent
                </h2>
                <div className="prose prose-invert max-w-none text-textPrimary space-y-4">
                  <p className="text-textMuted">
                    The Autonomous Agent proactively monitors your data and suggests actions to help you stay organized and productive.
                  </p>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Agent Modes</h3>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li><strong className="text-textPrimary">Monitor</strong> - Observes your data for patterns</li>
                      <li><strong className="text-textPrimary">Suggest</strong> - Proposes actions for your approval</li>
                      <li><strong className="text-textPrimary">Execute</strong> - Performs approved actions automatically</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Agent Settings</h3>
                    <p className="text-textMuted mb-2">
                      Configure agent behavior:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li><strong className="text-textPrimary">Proactivity Level</strong> - Low, Medium, or High</li>
                      <li><strong className="text-textPrimary">Approval Threshold</strong> - Confidence level for auto-approval</li>
                      <li><strong className="text-textPrimary">Auto-Approve Types</strong> - Action types that don't need approval</li>
                      <li><strong className="text-textPrimary">Focus Areas</strong> - What the agent should prioritize</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Pending Suggestions</h3>
                    <p className="text-textMuted">
                      Review and approve or reject agent suggestions. Each suggestion includes reasoning and confidence level.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Running Agent Cycle</h3>
                    <p className="text-textMuted">
                      Manually trigger an agent cycle to generate new suggestions based on current data. The agent analyzes patterns and proposes actions.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Activity History</h3>
                    <p className="text-textMuted">
                      View all agent activity including monitoring, suggestions, and executions. Filter by type, date, or search terms.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Digests */}
            <section id="digests" className="scroll-mt-4">
              <div className="bg-surfaceElevated border border-border/60 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-black text-textPrimary mb-4 flex items-center gap-2">
                  <span className="text-primary">15</span>
                  Digests & Reviews
                </h2>
                <div className="prose prose-invert max-w-none text-textPrimary space-y-4">
                  <p className="text-textMuted">
                    Digests provide AI-generated summaries of your activity, helping you review and plan.
                  </p>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Daily Digests</h3>
                    <p className="text-textMuted mb-2">
                      Daily digests run automatically every morning and include:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li>Summary of captures from the previous day</li>
                      <li>Priorities and action items</li>
                      <li>Items needing attention</li>
                    </ul>
                    <p className="text-textMuted mt-2">
                      You can also manually trigger a daily digest using the "Run Daily Digest" button.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Weekly Reviews</h3>
                    <p className="text-textMuted mb-2">
                      Weekly reviews run automatically on Sundays and provide:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li>Comprehensive week overview</li>
                      <li>Progress on projects and goals</li>
                      <li>Patterns and insights</li>
                      <li>Recommendations for the coming week</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Custom Digest Templates</h3>
                    <p className="text-textMuted mb-2">
                      Create custom digest templates for specific needs:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-textMuted ml-4">
                      <li>Click the "+" button to create a new template</li>
                      <li>Give it a name (e.g., "Today's Ideas Summary")</li>
                      <li>Write a prompt describing what you want summarized</li>
                      <li>Click the template tab to generate the digest on-demand</li>
                    </ol>
                    <p className="text-textMuted mt-2">
                      Custom digests are generated fresh each time you view them, so they always reflect current data.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Viewing Digests</h3>
                    <p className="text-textMuted">
                      Filter digests by type (All, Daily, Weekly, or Custom templates) to find specific summaries. Each digest shows the date it was created.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Predictions */}
            <section id="predictions" className="scroll-mt-4">
              <div className="bg-surfaceElevated border border-border/60 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-black text-textPrimary mb-4 flex items-center gap-2">
                  <span className="text-primary">16</span>
                  Predictions
                </h2>
                <div className="prose prose-invert max-w-none text-textPrimary space-y-4">
                  <p className="text-textMuted">
                    The prediction system learns from your patterns to anticipate what you might want to capture or do next.
                  </p>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Capture Predictions</h3>
                    <p className="text-textMuted">
                      As you type in the chat interface, the system may show predictions for what you're about to capture based on similar past captures.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Form Field Predictions</h3>
                    <p className="text-textMuted">
                      When editing items, the system can predict values for fields based on patterns in your data, speeding up data entry.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">How It Works</h3>
                    <p className="text-textMuted">
                      Predictions are generated using machine learning models trained on your capture history and patterns. The more you use Second Brain, the better predictions become.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Patterns */}
            <section id="patterns" className="scroll-mt-4">
              <div className="bg-surfaceElevated border border-border/60 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-black text-textPrimary mb-4 flex items-center gap-2">
                  <span className="text-primary">17</span>
                  Pattern Detection
                </h2>
                <div className="prose prose-invert max-w-none text-textPrimary space-y-4">
                  <p className="text-textMuted">
                    Pattern detection identifies relationships, trends, and opportunities in your data.
                  </p>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Pattern Recommendations</h3>
                    <p className="text-textMuted">
                      The system analyzes your captures to find patterns and suggests:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li>Potential relationships between items</li>
                      <li>Tags that might be useful</li>
                      <li>Actions you might want to take</li>
                      <li>Groupings or categorizations</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Insights</h3>
                    <p className="text-textMuted">
                      View insights generated from pattern analysis to understand trends in your work, productivity patterns, and opportunities for improvement.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Integrations */}
            <section id="integrations" className="scroll-mt-4">
              <div className="bg-surfaceElevated border border-border/60 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-black text-textPrimary mb-4 flex items-center gap-2">
                  <span className="text-primary">18</span>
                  Integrations
                </h2>
                <div className="prose prose-invert max-w-none text-textPrimary space-y-4">
                  <p className="text-textMuted">
                    Connect external services to enhance your Second Brain with data from other tools.
                  </p>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Available Integrations</h3>
                    <ul className="list-disc list-inside space-y-2 text-textMuted ml-4">
                      <li><strong className="text-textPrimary">Gmail</strong> - Capture emails and create tasks from messages</li>
                      <li><strong className="text-textPrimary">Google Calendar</strong> - Sync events and tasks with your calendar</li>
                      <li><strong className="text-textPrimary">Slack</strong> - Capture messages and post updates to channels</li>
                      <li><strong className="text-textPrimary">Notion</strong> - Sync databases and pages</li>
                      <li><strong className="text-textPrimary">Outlook</strong> - Capture emails from Outlook</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Connecting Integrations</h3>
                    <ol className="list-decimal list-inside space-y-2 text-textMuted ml-4">
                      <li>Go to the Integrations page</li>
                      <li>Click "Connect" for the service you want</li>
                      <li>Authorize the connection (you'll be redirected to the service)</li>
                      <li>Return to Second Brain - the integration will be active</li>
                    </ol>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Integration Status</h3>
                    <p className="text-textMuted mb-2">
                      Each integration shows its status:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li><strong className="text-textPrimary">Active</strong> - Connected and syncing</li>
                      <li><strong className="text-textPrimary">Error</strong> - Connection issue (check last error)</li>
                      <li><strong className="text-textPrimary">Disconnected</strong> - Not connected</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Disconnecting</h3>
                    <p className="text-textMuted">
                      Click "Disconnect" to remove an integration. This stops syncing but doesn't delete already captured data.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Email Integration</h3>
                    <p className="text-textMuted mb-2">
                      When emails are captured:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li>They're automatically classified</li>
                      <li>Can be linked to people or tasks</li>
                      <li>View all captured emails on the Emails page</li>
                      <li>Use "Sync Gmail" to manually trigger a sync</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Calendar Integration</h3>
                    <p className="text-textMuted">
                      Calendar events sync automatically and appear in your Calendar view. Current meetings are highlighted for easy identification.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Admin Features */}
            <section id="admin-features" className="scroll-mt-4">
              <div className="bg-surfaceElevated border border-border/60 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-black text-textPrimary mb-4 flex items-center gap-2">
                  <span className="text-primary">19</span>
                  Admin Features
                </h2>
                <div className="prose prose-invert max-w-none text-textPrimary space-y-4">
                  <p className="text-textMuted">
                    Advanced features for managing tasks, templates, and automation.
                  </p>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Kanban Board</h3>
                    <p className="text-textMuted mb-2">
                      Visual task management with drag-and-drop:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li>View tasks organized by status columns</li>
                      <li>Drag tasks between columns to change status</li>
                      <li>See task priority indicators</li>
                      <li>Click tasks to view details</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Analytics</h3>
                    <p className="text-textMuted">
                      View usage statistics, insights, and analytics about your Second Brain usage patterns.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Templates</h3>
                    <p className="text-textMuted">
                      Create reusable templates for actions and tasks to speed up common workflows.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Automation</h3>
                    <p className="text-textMuted">
                      Set up automation rules and workflows to handle repetitive tasks automatically.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Settings */}
            <section id="settings" className="scroll-mt-4">
              <div className="bg-surfaceElevated border border-border/60 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-black text-textPrimary mb-4 flex items-center gap-2">
                  <span className="text-primary">20</span>
                  Settings & Configuration
                </h2>
                <div className="prose prose-invert max-w-none text-textPrimary space-y-4">
                  <p className="text-textMuted">
                    Configure your workspace, AI settings, and system preferences.
                  </p>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Workspace Settings</h3>
                    <p className="text-textMuted mb-2">
                      Manage your workspace:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li><strong className="text-textPrimary">Tenant Management</strong> - Switch between workspaces</li>
                      <li><strong className="text-textPrimary">Members</strong> - Invite team members</li>
                      <li><strong className="text-textPrimary">Invitations</strong> - Manage pending invites</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">LLM Settings</h3>
                    <p className="text-textMuted mb-2">
                      Configure AI provider:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li>Choose provider (OpenAI or Anthropic)</li>
                      <li>Select model</li>
                      <li>Configure API keys</li>
                      <li>Set temperature and other parameters</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Categories</h3>
                    <p className="text-textMuted">
                      Create custom categories beyond the default four (People, Projects, Ideas, Admin). Define field schemas for each category.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Prompts</h3>
                    <p className="text-textMuted mb-2">
                      Customize AI prompts:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li><strong className="text-textPrimary">Classification Prompts</strong> - How items are classified</li>
                      <li><strong className="text-textPrimary">Digest Prompts</strong> - How digests are generated</li>
                      <li>Create multiple prompt templates</li>
                      <li>Set active prompt</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Routing</h3>
                    <p className="text-textMuted">
                      Configure category routing rules to automatically route items to specific databases based on classification results.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Learning System</h3>
                    <p className="text-textMuted">
                      Configure the learning system that improves classification accuracy over time based on your corrections and feedback.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Token Usage</h3>
                    <p className="text-textMuted">
                      Monitor API token usage to track costs and ensure you stay within limits. View usage by date and operation type.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Relationships */}
            <section id="relationships" className="scroll-mt-4">
              <div className="bg-surfaceElevated border border-border/60 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-black text-textPrimary mb-4 flex items-center gap-2">
                  <span className="text-primary">21</span>
                  Relationships
                </h2>
                <div className="prose prose-invert max-w-none text-textPrimary space-y-4">
                  <p className="text-textMuted">
                    Link items together to create relationships and see connections in your data.
                  </p>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Creating Relationships</h3>
                    <p className="text-textMuted mb-2">
                      Link items from the item detail page:
                    </p>
                    <ol className="list-decimal list-inside space-y-2 text-textMuted ml-4">
                      <li>Open an item's detail page</li>
                      <li>Find the Relationships section</li>
                      <li>Click "Add Relationship"</li>
                      <li>Select the related item and relationship type</li>
                      <li>Save the relationship</li>
                    </ol>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Relationship Graph</h3>
                    <p className="text-textMuted">
                      Visualize relationships as a graph to see how items connect. Useful for understanding project dependencies or people networks.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Relationship Insights</h3>
                    <p className="text-textMuted">
                      Get insights about relationships, such as which items are most connected or potential relationships that might exist.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Comments */}
            <section id="comments" className="scroll-mt-4">
              <div className="bg-surfaceElevated border border-border/60 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-black text-textPrimary mb-4 flex items-center gap-2">
                  <span className="text-primary">22</span>
                  Comments
                </h2>
                <div className="prose prose-invert max-w-none text-textPrimary space-y-4">
                  <p className="text-textMuted">
                    Add comments to items for additional context, notes, or collaboration.
                  </p>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Adding Comments</h3>
                    <ol className="list-decimal list-inside space-y-2 text-textMuted ml-4">
                      <li>Open an item's detail page</li>
                      <li>Scroll to the Comments section</li>
                      <li>Type your comment</li>
                      <li>Click "Add Comment"</li>
                    </ol>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Comment Features</h3>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li>Comments are timestamped</li>
                      <li>See who added each comment (in team workspaces)</li>
                      <li>Edit or delete your own comments</li>
                      <li>Comments appear in chronological order</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Attachments */}
            <section id="attachments" className="scroll-mt-4">
              <div className="bg-surfaceElevated border border-border/60 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-black text-textPrimary mb-4 flex items-center gap-2">
                  <span className="text-primary">23</span>
                  Attachments
                </h2>
                <div className="prose prose-invert max-w-none text-textPrimary space-y-4">
                  <p className="text-textMuted">
                    Attach files, images, or documents to items for reference and organization.
                  </p>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Uploading Attachments</h3>
                    <ol className="list-decimal list-inside space-y-2 text-textMuted ml-4">
                      <li>Open an item's detail page</li>
                      <li>Find the Attachments section</li>
                      <li>Click "Upload" or drag and drop files</li>
                      <li>Select files from your device</li>
                      <li>Files upload automatically</li>
                    </ol>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Supported Formats</h3>
                    <p className="text-textMuted">
                      Common file types are supported including PDFs, images (JPG, PNG, GIF), documents (DOC, DOCX), and more.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Managing Attachments</h3>
                    <p className="text-textMuted">
                      View, download, or delete attachments from the item detail page. Attachments are stored securely and accessible from any device.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Undo/Redo */}
            <section id="undo-redo" className="scroll-mt-4">
              <div className="bg-surfaceElevated border border-border/60 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-black text-textPrimary mb-4 flex items-center gap-2">
                  <span className="text-primary">24</span>
                  Undo & Redo
                </h2>
                <div className="prose prose-invert max-w-none text-textPrimary space-y-4">
                  <p className="text-textMuted">
                    Undo and redo actions to correct mistakes or revert changes.
                  </p>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Using Undo/Redo</h3>
                    <p className="text-textMuted mb-2">
                      The Undo/Redo controls are located in the top navigation bar:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li>Click the undo button to reverse the last action</li>
                      <li>Click the redo button to reapply a reversed action</li>
                      <li>Action history is maintained for recent changes</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">What Can Be Undone</h3>
                    <p className="text-textMuted">
                      Most actions can be undone including edits, deletions, status changes, and more. Some actions like permanent deletions may have limitations.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Saved Searches */}
            <section id="saved-searches" className="scroll-mt-4">
              <div className="bg-surfaceElevated border border-border/60 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-black text-textPrimary mb-4 flex items-center gap-2">
                  <span className="text-primary">25</span>
                  Saved Searches
                </h2>
                <div className="prose prose-invert max-w-none text-textPrimary space-y-4">
                  <p className="text-textMuted">
                    Save frequently used search queries for quick access.
                  </p>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Creating Saved Searches</h3>
                    <ol className="list-decimal list-inside space-y-2 text-textMuted ml-4">
                      <li>Perform a search with your desired filters</li>
                      <li>Click "Save Search"</li>
                      <li>Give it a name</li>
                      <li>The search is saved for future use</li>
                    </ol>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Using Saved Searches</h3>
                    <p className="text-textMuted">
                      Click on a saved search from the dashboard to instantly run that query. Saved searches appear on your dashboard for quick access.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Managing Saved Searches</h3>
                    <p className="text-textMuted">
                      Edit or delete saved searches from the dashboard. Update them as your needs change.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Query Engine */}
            <section id="query-engine" className="scroll-mt-4">
              <div className="bg-surfaceElevated border border-border/60 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-black text-textPrimary mb-4 flex items-center gap-2">
                  <span className="text-primary">26</span>
                  Query Engine
                </h2>
                <div className="prose prose-invert max-w-none text-textPrimary space-y-4">
                  <p className="text-textMuted">
                    Use natural language to query your data across all databases.
                  </p>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Natural Language Queries</h3>
                    <p className="text-textMuted mb-2">
                      Ask questions in plain English:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-textMuted ml-4">
                      <li>"Show me all blocked projects"</li>
                      <li>"What tasks are due this week?"</li>
                      <li>"Find items related to John"</li>
                      <li>"Show ideas from last month"</li>
                      <li>"What are my high priority tasks?"</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Query Results</h3>
                    <p className="text-textMuted">
                      Results are displayed with relevant items from all databases. Click on any result to view details.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Query History</h3>
                    <p className="text-textMuted">
                      View your query history to see past searches and reuse effective queries.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Tips & Best Practices */}
            <section id="tips" className="scroll-mt-4">
              <div className="bg-surfaceElevated border border-border/60 rounded-xl p-6 shadow-xl">
                <h2 className="text-2xl font-black text-textPrimary mb-4 flex items-center gap-2">
                  <span className="text-primary">27</span>
                  Tips & Best Practices
                </h2>
                <div className="prose prose-invert max-w-none text-textPrimary space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Effective Capture Strategies</h3>
                    <ul className="list-disc list-inside space-y-2 text-textMuted ml-4">
                      <li><strong className="text-textPrimary">Capture immediately</strong> - Don't wait, capture thoughts as they occur</li>
                      <li><strong className="text-textPrimary">Be specific</strong> - Include context and details in captures</li>
                      <li><strong className="text-textPrimary">Use voice capture</strong> - Faster for quick thoughts on the go</li>
                      <li><strong className="text-textPrimary">Review regularly</strong> - Check Inbox Log to fix misclassifications</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Organization Tips</h3>
                    <ul className="list-disc list-inside space-y-2 text-textMuted ml-4">
                      <li><strong className="text-textPrimary">Use tags consistently</strong> - Establish tag conventions early</li>
                      <li><strong className="text-textPrimary">Link related items</strong> - Create relationships for better organization</li>
                      <li><strong className="text-textPrimary">Update status regularly</strong> - Keep project and task statuses current</li>
                      <li><strong className="text-textPrimary">Archive completed items</strong> - Move done items out of active views</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Workflow Optimization</h3>
                    <ul className="list-disc list-inside space-y-2 text-textMuted ml-4">
                      <li><strong className="text-textPrimary">Set up workflows</strong> - Automate repetitive tasks</li>
                      <li><strong className="text-textPrimary">Use templates</strong> - Create templates for common actions</li>
                      <li><strong className="text-textPrimary">Leverage the agent</strong> - Let the agent suggest actions</li>
                      <li><strong className="text-textPrimary">Review digests</strong> - Use daily/weekly digests for planning</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Integration Best Practices</h3>
                    <ul className="list-disc list-inside space-y-2 text-textMuted ml-4">
                      <li><strong className="text-textPrimary">Connect key services</strong> - Link email and calendar for comprehensive capture</li>
                      <li><strong className="text-textPrimary">Review sync status</strong> - Check integration status regularly</li>
                      <li><strong className="text-textPrimary">Use filters</strong> - Filter captured emails to find important items</li>
                      <li><strong className="text-textPrimary">Sync regularly</strong> - Manually trigger syncs when needed</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-textPrimary mb-2">Getting the Most from AI</h3>
                    <ul className="list-disc list-inside space-y-2 text-textMuted ml-4">
                      <li><strong className="text-textPrimary">Fix misclassifications</strong> - Help the AI learn your preferences</li>
                      <li><strong className="text-textPrimary">Provide context</strong> - Include relevant details in captures</li>
                      <li><strong className="text-textPrimary">Review suggestions</strong> - Consider agent and pattern recommendations</li>
                      <li><strong className="text-textPrimary">Customize prompts</strong> - Adjust prompts in settings for better results</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-border/60 text-center">
              <p className="text-textMuted text-sm">
                Need more help? Check the settings page for additional configuration options or contact support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
