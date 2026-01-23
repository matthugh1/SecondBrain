'use client'

import { useState, useEffect } from 'react'

interface TimeTrackerProps {
  taskId: number
  estimatedDuration?: number // minutes
  actualDuration?: number // minutes
  onUpdate: (estimated?: number, actual?: number) => void
}

export default function TimeTracker({
  taskId,
  estimatedDuration = 0,
  actualDuration = 0,
  onUpdate,
}: TimeTrackerProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [estimatedMinutes, setEstimatedMinutes] = useState(estimatedDuration || 0)
  const [manualMinutes, setManualMinutes] = useState(0)

  if (!taskId) {
    return null
  }

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1)
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning])

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const handleStart = () => {
    setIsRunning(true)
  }

  const handleStop = () => {
    setIsRunning(false)
    const totalMinutes = Math.floor(elapsedSeconds / 60) + manualMinutes
    onUpdate(estimatedMinutes, totalMinutes)
    setElapsedSeconds(0)
  }

  const handleSaveEstimated = () => {
    onUpdate(estimatedMinutes, actualDuration)
  }

  const handleSaveManual = () => {
    onUpdate(estimatedMinutes, manualMinutes)
  }

  const totalActualMinutes = Math.floor(elapsedSeconds / 60) + manualMinutes + (actualDuration || 0)

  return (
    <div className="p-4 bg-surfaceElevated border border-border/60 rounded-xl shadow-xl">
      <h4 className="text-sm font-bold text-textPrimary mb-3 uppercase tracking-widest">Time Tracking</h4>
      
      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">Estimated (minutes)</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(parseInt(e.target.value) || 0)}
              className="flex-1 px-4 py-2.5 bg-surface border border-border/60 rounded-xl text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              min="0"
            />
            <button
              onClick={handleSaveEstimated}
              className="px-4 py-2.5 bg-primary text-textPrimary rounded-xl text-sm font-medium hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
            >
              Save
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">Manual Entry (minutes)</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={manualMinutes}
              onChange={(e) => setManualMinutes(parseInt(e.target.value) || 0)}
              className="flex-1 px-4 py-2.5 bg-surface border border-border/60 rounded-xl text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              min="0"
            />
            <button
              onClick={handleSaveManual}
              className="px-4 py-2.5 bg-primary text-textPrimary rounded-xl text-sm font-medium hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
            >
              Save
            </button>
          </div>
        </div>

        <div className="border-t border-border/60 pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-textMuted uppercase tracking-widest">Timer</span>
            <span className="text-lg font-mono text-textPrimary">{formatTime(elapsedSeconds)}</span>
          </div>
          <div className="flex gap-2">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="flex-1 px-4 py-2 bg-success text-textPrimary rounded-lg hover:bg-success/90 shadow-lg shadow-success/20 transition-all font-medium"
              >
                Start
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="flex-1 px-4 py-2 bg-error text-textPrimary rounded-lg hover:bg-error/90 shadow-lg shadow-error/20 transition-all font-medium"
              >
                Stop
              </button>
            )}
          </div>
        </div>

        <div className="border-t border-border/60 pt-3 text-xs">
          <div className="flex justify-between text-textMuted">
            <span>Estimated:</span>
            <span className="text-textPrimary font-medium">{estimatedMinutes} min</span>
          </div>
          <div className="flex justify-between text-textMuted mt-1">
            <span>Actual:</span>
            <span className="text-textPrimary font-medium">{totalActualMinutes} min</span>
          </div>
          {estimatedMinutes > 0 && (
            <div className="flex justify-between mt-1 text-textMuted">
              <span>Variance:</span>
              <span className={`font-medium ${totalActualMinutes > estimatedMinutes ? 'text-error' : 'text-success'}`}>
                {totalActualMinutes > estimatedMinutes ? '+' : ''}
                {totalActualMinutes - estimatedMinutes} min
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
