/**
 * Browser Speech-to-Text service using Web Speech API
 */

export interface SpeechRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
}

export class VoiceCaptureService {
  private recognition: any = null
  private isSupported: boolean = false

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition()
        this.recognition.continuous = true
        this.recognition.interimResults = true
        this.recognition.lang = 'en-US'
        this.isSupported = true
      }
    }
  }

  /**
   * Check if speech recognition is supported
   */
  isSpeechRecognitionSupported(): boolean {
    return this.isSupported
  }

  /**
   * Start voice capture
   */
  startCapture(
    onResult: (result: SpeechRecognitionResult) => void,
    onError?: (error: string) => void,
    onEnd?: () => void
  ): void {
    if (!this.isSupported || !this.recognition) {
      onError?.('Speech recognition not supported in this browser')
      return
    }

    this.recognition.onresult = (event: any) => {
      let finalTranscript = ''
      let interimTranscript = ''
      let maxConfidence = 0

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        const confidence = event.results[i][0].confidence || 0.5

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' '
          maxConfidence = Math.max(maxConfidence, confidence)
        } else {
          interimTranscript += transcript
        }
      }

      const fullTranscript = finalTranscript || interimTranscript
      if (fullTranscript.trim()) {
        onResult({
          transcript: fullTranscript.trim(),
          confidence: maxConfidence || 0.5,
          isFinal: !!finalTranscript,
        })
      }
    }

    this.recognition.onerror = (event: any) => {
      onError?.(event.error || 'Speech recognition error')
    }

    this.recognition.onend = () => {
      onEnd?.()
    }

    try {
      this.recognition.start()
    } catch (error) {
      onError?.('Failed to start speech recognition')
    }
  }

  /**
   * Stop voice capture
   */
  stopCapture(): void {
    if (this.recognition) {
      try {
        this.recognition.stop()
      } catch (error) {
        // Ignore errors when stopping
      }
    }
  }

  /**
   * Abort voice capture
   */
  abortCapture(): void {
    if (this.recognition) {
      try {
        this.recognition.abort()
      } catch (error) {
        // Ignore errors when aborting
      }
    }
  }
}

/**
 * Parse voice commands
 */
export function parseVoiceCommand(transcript: string): {
  command: string
  action: string
  parameters: Record<string, any>
} | null {
  const lowerTranscript = transcript.toLowerCase().trim()

  // Create task command
  if (lowerTranscript.startsWith('create a task') || lowerTranscript.startsWith('create task')) {
    const taskText = transcript.replace(/^create (a )?task (to )?/i, '').trim()
    return {
      command: 'create_task',
      action: 'create',
      parameters: {
        category: 'admin',
        name: taskText,
      },
    }
  }

  // Show tasks command
  if (lowerTranscript.includes('show me tasks') || lowerTranscript.includes('show tasks')) {
    if (lowerTranscript.includes('due today') || lowerTranscript.includes('today')) {
      return {
        command: 'list_tasks_today',
        action: 'query',
        parameters: {
          type: 'admin',
          filter: 'due_today',
        },
      }
    }
    return {
      command: 'list_tasks',
      action: 'query',
      parameters: {
        type: 'admin',
      },
    }
  }

  // Show projects command
  if (lowerTranscript.includes('what projects') || lowerTranscript.includes('show projects')) {
    if (lowerTranscript.includes('active')) {
      return {
        command: 'list_active_projects',
        action: 'query',
        parameters: {
          type: 'projects',
          filter: 'active',
        },
      }
    }
    return {
      command: 'list_projects',
      action: 'query',
      parameters: {
        type: 'projects',
      },
    }
  }

  // Capture command (default)
  return {
    command: 'capture',
    action: 'capture',
    parameters: {
      text: transcript,
    },
  }
}
