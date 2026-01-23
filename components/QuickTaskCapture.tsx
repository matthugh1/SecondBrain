'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function QuickTaskCapture() {
  const [isOpen, setIsOpen] = useState(false)
  const [taskName, setTaskName] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef<any>(null)
  const router = useRouter()

  useEffect(() => {
    // Initialize speech recognition if available
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setTranscript(transcript)
        setTaskName(transcript)
        setIsRecording(false)
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
      }

      recognitionRef.current.onend = () => {
        setIsRecording(false)
      }
    }
  }, [])

  const handleStartRecording = () => {
    if (recognitionRef.current) {
      setIsRecording(true)
      recognitionRef.current.start()
    }
  }

  const handleStopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleCreateTask = async () => {
    if (!taskName.trim()) return

    try {
      // Parse task name for due date and priority hints
      const parsed = parseTaskText(taskName)
      
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: parsed.name,
          due_date: parsed.dueDate,
          priority: parsed.priority,
          status: 'Todo',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setTaskName('')
        setTranscript('')
        setIsOpen(false)
        router.push(`/admin/${data.id}`)
      }
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const parseTaskText = (text: string): { name: string; dueDate?: string; priority?: string } => {
    let name = text
    let dueDate: string | undefined
    let priority: string | undefined

    // Extract priority hints
    const priorityKeywords = {
      urgent: ['urgent', 'asap', 'immediately', 'critical'],
      high: ['important', 'high priority', 'soon'],
      low: ['low priority', 'whenever', 'someday'],
    }

    for (const [prio, keywords] of Object.entries(priorityKeywords)) {
      if (keywords.some(kw => text.toLowerCase().includes(kw))) {
        priority = prio
        name = name.replace(new RegExp(keywords.join('|'), 'gi'), '').trim()
        break
      }
    }

    // Extract date hints (simple parsing)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (text.toLowerCase().includes('today')) {
      dueDate = today.toISOString().split('T')[0]
      name = name.replace(/today/gi, '').trim()
    } else if (text.toLowerCase().includes('tomorrow')) {
      dueDate = tomorrow.toISOString().split('T')[0]
      name = name.replace(/tomorrow/gi, '').trim()
    }

    return { name: name.trim() || text, dueDate, priority }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 bg-primary text-textPrimary rounded-full shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30 transition-all flex items-center justify-center z-50"
        title="Quick Add Task"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    )
  }

  return (
    <div className="fixed bottom-8 right-8 w-96 bg-surfaceElevated border border-border/60 rounded-xl shadow-2xl z-50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-textPrimary">Quick Add Task</h3>
        <button
          onClick={() => {
            setIsOpen(false)
            setTaskName('')
            setTranscript('')
            handleStopRecording()
          }}
          className="text-textMuted hover:text-textPrimary transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">Task Name</label>
          <textarea
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="Enter task name or use voice input..."
            className="w-full px-4 py-2.5 bg-surface border border-border/60 rounded-xl text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
            rows={3}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleCreateTask()
              }
            }}
          />
        </div>

        {recognitionRef.current && (
          <div>
            <button
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              className={`w-full px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-all ${
                isRecording
                  ? 'bg-error text-textPrimary hover:bg-error/90 shadow-lg shadow-error/20'
                  : 'bg-info text-textPrimary hover:bg-info/90 shadow-lg shadow-info/20'
              }`}
            >
              {isRecording ? (
                <>
                  <span className="w-3 h-3 bg-textPrimary rounded-full animate-pulse" />
                  Recording... Click to stop
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Start Voice Input
                </>
              )}
            </button>
          </div>
        )}

        {transcript && (
          <div className="text-xs text-textMuted">
            Heard: {transcript}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleCreateTask}
            className="flex-1 px-4 py-2 bg-primary text-textPrimary rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-medium"
          >
            Create Task
          </button>
          <button
            onClick={() => {
              setIsOpen(false)
              setTaskName('')
              setTranscript('')
            }}
            className="px-4 py-2 bg-surface text-textMuted rounded-lg hover:bg-surfaceElevated border border-border/60 transition-all font-medium"
          >
            Cancel
          </button>
        </div>

        <div className="text-xs text-textMuted">
          Tip: Press Ctrl+Enter to quickly create
        </div>
      </div>
    </div>
  )
}
