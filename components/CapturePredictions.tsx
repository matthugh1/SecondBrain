'use client'

import { useState, useEffect } from 'react'

interface Prediction {
  type: string
  content: string
  confidence: number
  category?: string
}

interface CapturePredictionsProps {
  onAccept: (prediction: Prediction) => void
}

export default function CapturePredictions({ onAccept }: CapturePredictionsProps) {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPredictions()
  }, [])

  const fetchPredictions = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/predictions/capture')
      if (response.ok) {
        const data = await response.json()
        setPredictions(data.predictions || [])
      }
    } catch (error) {
      console.error('Error fetching predictions:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || predictions.length === 0) {
    return null
  }

  return (
    <div className="mb-3 space-y-2">
      <div className="text-xs font-medium text-textMuted uppercase tracking-tighter mb-2">
        You might want to capture...
      </div>
      {predictions.map((prediction, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between p-2 bg-surfaceElevated border border-border rounded-lg hover:bg-surface transition-colors"
        >
          <div className="flex-1">
            <p className="text-sm text-textPrimary">{prediction.content}</p>
            {prediction.category && (
              <p className="text-xs text-textMuted mt-0.5">{prediction.category}</p>
            )}
            {prediction.confidence && (
              <p className="text-xs text-textMuted mt-0.5">
                {Math.round(prediction.confidence * 100)}% confidence
              </p>
            )}
          </div>
          <div className="flex gap-2 ml-3">
            <button
              onClick={() => onAccept(prediction)}
              className="px-3 py-1 text-xs bg-primary text-textPrimary rounded hover:bg-primary/90 transition-colors"
            >
              Use
            </button>
            <button
              onClick={() => {
                setPredictions(prev => prev.filter((_, i) => i !== idx))
              }}
              className="px-2 py-1 text-xs text-textMuted hover:text-textPrimary transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
