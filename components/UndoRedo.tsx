'use client'

import { useState, useEffect } from 'react'

interface UndoRedoProps {
  onAction?: () => void
}

export default function UndoRedo({ onAction }: UndoRedoProps) {
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [loading, setLoading] = useState(false)

  const checkActions = async () => {
    // Check if undo/redo is available
    // This is a simplified check - in a real app you'd query the API
    setCanUndo(true) // Assume true for now
    setCanRedo(false) // Assume false for now
  }

  useEffect(() => {
    checkActions()
    // Check periodically
    const interval = setInterval(checkActions, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleUndo = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/undo', { method: 'POST' })
      const result = await response.json()
      if (result.success) {
        onAction?.()
        await checkActions()
      } else {
        alert(result.message || 'Nothing to undo')
      }
    } catch (error) {
      console.error('Error undoing:', error)
      alert('Failed to undo')
    } finally {
      setLoading(false)
    }
  }

  const handleRedo = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/redo', { method: 'POST' })
      const result = await response.json()
      if (result.success) {
        onAction?.()
        await checkActions()
      } else {
        alert(result.message || 'Nothing to redo')
      }
    } catch (error) {
      console.error('Error redoing:', error)
      alert('Failed to redo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={handleUndo}
        disabled={!canUndo || loading}
        className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
        title="Undo (Ctrl+Z)"
      >
        ↶ Undo
      </button>
      <button
        onClick={handleRedo}
        disabled={!canRedo || loading}
        className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
        title="Redo (Ctrl+Y)"
      >
        ↷ Redo
      </button>
    </div>
  )
}
