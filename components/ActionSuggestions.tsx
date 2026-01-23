'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ActionSuggestion {
  id: number
  type: string
  action: string
  description: string
  priority: number
  targetType?: string
  targetId?: number
}

export default function ActionSuggestions() {
  const [suggestions, setSuggestions] = useState<ActionSuggestion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSuggestions()
  }, [])

  const fetchSuggestions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/suggestions/actions')
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (error) {
      console.error('Error fetching action suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = async (suggestionId: number) => {
    try {
      await fetch(`/api/suggestions/actions/${suggestionId}`, {
        method: 'DELETE',
      })
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId))
    } catch (error) {
      console.error('Error dismissing suggestion:', error)
    }
  }

  const handleCreateTask = async (suggestion: ActionSuggestion) => {
    try {
      // Create a task based on the suggestion
      const response = await fetch('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: suggestion.description,
          category: 'admin',
        }),
      })
      if (response.ok) {
        handleDismiss(suggestion.id)
        // Optionally refresh the page or show success message
      }
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-surfaceElevated border border-border rounded-xl p-6">
        <h2 className="text-lg font-bold text-textPrimary mb-4">Action Suggestions</h2>
        <div className="text-sm text-textMuted">Loading...</div>
      </div>
    )
  }

  if (suggestions.length === 0) {
    return null
  }

  return (
    <div className="bg-surfaceElevated border border-border rounded-xl p-6">
      <h2 className="text-lg font-bold text-textPrimary mb-4">Action Suggestions</h2>
      <div className="space-y-3">
        {suggestions.slice(0, 5).map((suggestion) => (
          <div
            key={suggestion.id}
            className="p-3 bg-surface border border-border rounded-lg hover:bg-surface/80 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-medium text-textPrimary text-sm">{suggestion.description}</p>
                {suggestion.targetType && suggestion.targetId && (
                  <Link
                    href={`/${suggestion.targetType}/${suggestion.targetId}`}
                    className="text-xs text-primary hover:text-primary/80 mt-1 inline-block"
                  >
                    View {suggestion.targetType}
                  </Link>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    suggestion.priority >= 0.8
                      ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      : suggestion.priority >= 0.5
                      ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                      : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                  }`}>
                    {suggestion.priority >= 0.8 ? 'High' : suggestion.priority >= 0.5 ? 'Medium' : 'Low'} Priority
                  </span>
                </div>
              </div>
              <div className="flex gap-2 ml-3">
                <button
                  onClick={() => handleCreateTask(suggestion)}
                  className="px-3 py-1 text-xs bg-primary text-textPrimary rounded hover:bg-primary/90 transition-colors"
                >
                  Create Task
                </button>
                <button
                  onClick={() => handleDismiss(suggestion.id)}
                  className="px-2 py-1 text-xs text-textMuted hover:text-textPrimary transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
