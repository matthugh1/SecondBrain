'use client'

import { useState, useEffect, useRef } from 'react'
import { VoiceCaptureService, parseVoiceCommand } from '@/lib/services/voice-capture'

interface VoiceInputProps {
  onTranscript: (transcript: string, isFinal: boolean) => void
  onCommand?: (command: { command: string; action: string; parameters: Record<string, any> }) => void
  disabled?: boolean
}

export default function VoiceInput({ onTranscript, onCommand, disabled }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const voiceServiceRef = useRef<VoiceCaptureService | null>(null)

  useEffect(() => {
    voiceServiceRef.current = new VoiceCaptureService()
    setIsSupported(voiceServiceRef.current.isSpeechRecognitionSupported())
  }, [])

  const startListening = () => {
    if (!voiceServiceRef.current || disabled) return

    setIsListening(true)
    setTranscript('')

    voiceServiceRef.current.startCapture(
      (result) => {
        setTranscript(result.transcript)
        onTranscript(result.transcript, result.isFinal)

        // Parse command if final
        if (result.isFinal && onCommand) {
          const command = parseVoiceCommand(result.transcript)
          if (command) {
            onCommand(command)
          }
        }
      },
      (error) => {
        console.error('Voice recognition error:', error)
        setIsListening(false)
      },
      () => {
        setIsListening(false)
      }
    )
  }

  const stopListening = () => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.stopCapture()
      setIsListening(false)
    }
  }

  if (!isSupported) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400">
        Voice input not supported in this browser
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {isListening ? (
        <>
          <button
            onClick={stopListening}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
          >
            <span className="w-3 h-3 bg-white rounded-full animate-pulse"></span>
            Stop Recording
          </button>
          {transcript && (
            <div className="text-sm text-gray-600 dark:text-gray-400 italic">
              {transcript}
            </div>
          )}
        </>
      ) : (
        <button
          onClick={startListening}
          disabled={disabled}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
          Start Voice Input
        </button>
      )}
    </div>
  )
}
