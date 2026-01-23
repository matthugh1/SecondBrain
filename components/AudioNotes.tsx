'use client'

import { useState, useEffect, useRef } from 'react'
import type { Category } from '@/types'

interface AudioNote {
  id: number
  itemType: Category
  itemId: number
  audioUrl: string
  transcription?: string
  transcriptionConfidence?: number
  duration?: number
  createdAt: string
}

interface AudioNotesProps {
  itemType: Category
  itemId: number
}

export default function AudioNotes({ itemType, itemId }: AudioNotesProps) {
  const [notes, setNotes] = useState<AudioNote[]>([])
  const [loading, setLoading] = useState(true)
  const [playingId, setPlayingId] = useState<number | null>(null)
  const [editingTranscription, setEditingTranscription] = useState<number | null>(null)
  const [transcriptionValue, setTranscriptionValue] = useState('')
  const audioRefs = useRef<Record<number, HTMLAudioElement>>({})

  useEffect(() => {
    if (itemId) {
      fetchNotes()
    }
  }, [itemType, itemId])

  const fetchNotes = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/audio?itemType=${itemType}&itemId=${itemId}`)
      if (response.ok) {
        const data = await response.json()
        setNotes(data.notes || [])
      }
    } catch (error) {
      console.error('Error fetching audio notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlay = (noteId: number, audioUrl: string) => {
    // Stop any currently playing audio
    Object.values(audioRefs.current).forEach(audio => {
      if (audio && !audio.paused) {
        audio.pause()
        audio.currentTime = 0
      }
    })

    if (playingId === noteId) {
      setPlayingId(null)
      return
    }

    const audio = audioRefs.current[noteId] || new Audio(audioUrl)
    audioRefs.current[noteId] = audio

    audio.onended = () => setPlayingId(null)
    audio.play()
    setPlayingId(noteId)
  }

  const handleDelete = async (noteId: number) => {
    if (!confirm('Delete this audio note?')) return

    try {
      const response = await fetch(`/api/audio/${noteId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        setNotes(prev => prev.filter(n => n.id !== noteId))
      }
    } catch (error) {
      console.error('Error deleting audio note:', error)
    }
  }

  const handleSaveTranscription = async (noteId: number) => {
    try {
      const response = await fetch(`/api/audio/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcription: transcriptionValue }),
      })
      if (response.ok) {
        setNotes(prev => prev.map(n => 
          n.id === noteId ? { ...n, transcription: transcriptionValue } : n
        ))
        setEditingTranscription(null)
      }
    } catch (error) {
      console.error('Error saving transcription:', error)
    }
  }

  const handleRetranscribe = async (noteId: number) => {
    try {
      const response = await fetch(`/api/audio/${noteId}/transcribe`, {
        method: 'POST',
      })
      if (response.ok) {
        const data = await response.json()
        setNotes(prev => prev.map(n => 
          n.id === noteId ? { 
            ...n, 
            transcription: data.transcription,
            transcriptionConfidence: data.confidence 
          } : n
        ))
      }
    } catch (error) {
      console.error('Error retranscribing:', error)
    }
  }

  if (loading) {
    return (
      <div className="mt-8 pt-6 border-t border-border/60">
        <h3 className="text-lg font-bold text-textPrimary mb-4">
          Audio Notes
        </h3>
        <div className="text-sm text-textMuted">Loading...</div>
      </div>
    )
  }

  return (
    <div className="mt-8 pt-6 border-t border-border/60">
      <h3 className="text-lg font-bold text-textPrimary mb-4">
        Audio Notes ({notes.length})
      </h3>
      
      {notes.length === 0 ? (
        <div className="text-sm text-textMuted">
          No audio notes yet. Use the voice input to record audio notes.
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-4 bg-surfaceElevated rounded-lg border border-border/60"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handlePlay(note.id, note.audioUrl)}
                    className="w-10 h-10 flex items-center justify-center bg-primary text-textPrimary rounded-full hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                  >
                    {playingId === note.id ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                  <div>
                    <p className="text-sm text-textMuted">
                      {new Date(note.createdAt).toLocaleString()}
                    </p>
                    {note.duration && (
                      <p className="text-xs text-textMuted">
                        {Math.round(note.duration)}s
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="text-error hover:text-error/80 text-sm transition-colors"
                >
                  Delete
                </button>
              </div>

              {editingTranscription === note.id ? (
                <div className="space-y-2">
                  <textarea
                    value={transcriptionValue}
                    onChange={(e) => setTranscriptionValue(e.target.value)}
                    className="w-full px-4 py-2.5 bg-surface border border-border/60 rounded-xl text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-y text-sm"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveTranscription(note.id)}
                      className="px-3 py-1 text-sm bg-primary text-textPrimary rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingTranscription(null)
                        setTranscriptionValue('')
                      }}
                      className="px-3 py-1 text-sm bg-surface text-textMuted rounded-lg hover:bg-surfaceElevated border border-border/60 transition-all font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {note.transcription ? (
                    <div>
                      <p className="text-sm text-textPrimary mb-2">
                        {note.transcription}
                      </p>
                      {note.transcriptionConfidence && (
                        <p className="text-xs text-textMuted mb-2">
                          Confidence: {Math.round(note.transcriptionConfidence * 100)}%
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingTranscription(note.id)
                            setTranscriptionValue(note.transcription || '')
                          }}
                          className="text-xs text-secondary hover:text-secondary/80 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleRetranscribe(note.id)}
                          className="text-xs text-textMuted hover:text-textPrimary transition-colors"
                        >
                          Re-transcribe
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-textMuted mb-2">
                        No transcription available
                      </p>
                      <button
                        onClick={() => handleRetranscribe(note.id)}
                        className="text-xs text-secondary hover:text-secondary/80 transition-colors"
                      >
                        Transcribe
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
