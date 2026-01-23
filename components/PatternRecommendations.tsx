'use client'

import { useState, useEffect } from 'react'

interface PatternRecommendation {
  pattern: string
  insight: string
  recommendation: string
  confidence: number
}

export default function PatternRecommendations() {
  const [recommendations, setRecommendations] = useState<PatternRecommendation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const fetchRecommendations = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/suggestions/patterns')
      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.recommendations || [])
      }
    } catch (error) {
      console.error('Error fetching pattern recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFeedback = async (pattern: string, useful: boolean) => {
    try {
      await fetch('/api/suggestions/patterns/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern, useful }),
      })
      // Optionally remove from display or show thank you message
    } catch (error) {
      console.error('Error submitting feedback:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-surfaceElevated border border-border rounded-xl p-6">
        <h2 className="text-lg font-bold text-textPrimary mb-4">Pattern Insights</h2>
        <div className="text-sm text-textMuted">Loading...</div>
      </div>
    )
  }

  if (recommendations.length === 0) {
    return null
  }

  return (
    <div className="bg-surfaceElevated border border-border rounded-xl p-6">
      <h2 className="text-lg font-bold text-textPrimary mb-4">Pattern Insights</h2>
      <div className="space-y-4">
        {recommendations.slice(0, 3).map((rec, idx) => (
          <div
            key={idx}
            className="p-4 bg-surface border border-border rounded-lg"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-textPrimary text-sm">{rec.pattern}</h3>
              <span className="text-xs text-textMuted">
                {Math.round(rec.confidence * 100)}% confidence
              </span>
            </div>
            <p className="text-sm text-textMuted mb-2">{rec.insight}</p>
            <p className="text-sm text-textPrimary font-medium mb-3">{rec.recommendation}</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleFeedback(rec.pattern, true)}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Useful
              </button>
              <button
                onClick={() => handleFeedback(rec.pattern, false)}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Not Useful
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
