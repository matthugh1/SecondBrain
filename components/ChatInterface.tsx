'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useChat } from '@/contexts/ChatContext'
import { useDataUpdate } from '@/contexts/DataUpdateContext'
import type { Message } from '@/contexts/ChatContext'
import type { CaptureResult } from '@/lib/services/capture'
import QueryResults from '@/components/QueryResults'
import CapturePredictions from '@/components/CapturePredictions'
import SmartAutocomplete from '@/components/SmartAutocomplete'
import { VoiceCaptureService, parseVoiceCommand } from '@/lib/services/voice-capture'

interface CurrentMeeting {
  id: number
  subject: string
  startTime: string
  endTime: string
  location?: string | null
  attendees?: string | null
}

export default function ChatInterface() {
  const { messages, setMessages } = useChat()
  const { notifyUpdate } = useDataUpdate()
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentMeeting, setCurrentMeeting] = useState<CurrentMeeting | null>(null)
  const [isListening, setIsListening] = useState(false)
  const [isVoiceSupported, setIsVoiceSupported] = useState(false)
  const voiceServiceRef = useRef<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize voice capture service
  useEffect(() => {
    try {
      const service = new VoiceCaptureService()
      setIsVoiceSupported(service.isSpeechRecognitionSupported())
      voiceServiceRef.current = service
    } catch (error) {
      console.error('Voice capture not available:', error)
      setIsVoiceSupported(false)
    }
  }, [])

  const startVoiceInput = () => {
    if (!voiceServiceRef.current || !isVoiceSupported) return

    setIsListening(true)
    setInput('') // Clear input when starting voice
    
    const transcriptRef = { current: '' }
    const hasSubmittedRef = { current: false } // Track if we've already submitted
    
    voiceServiceRef.current.startCapture(
      (result: any) => {
        setInput(result.transcript)
        transcriptRef.current = result.transcript
        if (result.isFinal && result.transcript.trim() && !hasSubmittedRef.current) {
          setIsListening(false)
          const finalText = result.transcript.trim()
          hasSubmittedRef.current = true // Mark as submitted
          
          // Set input and submit automatically
          setInput(finalText)
          
          // Submit after state update
          setTimeout(() => {
            const syntheticEvent = {
              preventDefault: () => {},
              stopPropagation: () => {},
            } as React.FormEvent<HTMLFormElement>
            
            // Submit with the final text directly
            handleSubmit(syntheticEvent, finalText).catch((err) => {
              console.error('Error submitting voice input:', err)
            })
          }, 200)
        }
      },
      (error: any) => {
        console.error('Voice recognition error:', error)
        setIsListening(false)
      },
      () => {
        // When recording ends, submit if we have text and haven't already submitted
        setIsListening(false)
        const textToSubmit = transcriptRef.current.trim()
        if (textToSubmit && !isLoading && !hasSubmittedRef.current) {
          hasSubmittedRef.current = true // Mark as submitted
          setInput(textToSubmit)
          setTimeout(() => {
            const syntheticEvent = {
              preventDefault: () => {},
              stopPropagation: () => {},
            } as React.FormEvent<HTMLFormElement>
            handleSubmit(syntheticEvent, textToSubmit).catch(console.error)
          }, 100)
        }
      }
    )
  }

  const stopVoiceInput = () => {
    if (voiceServiceRef.current) {
      voiceServiceRef.current.stopCapture()
      setIsListening(false)
    }
  }

  // Fetch current meeting status
  useEffect(() => {
    const fetchCurrentMeeting = async () => {
      try {
        const response = await fetch('/api/calendar/current', {
          credentials: 'include',
        })
        if (response.ok) {
          const data = await response.json()
          setCurrentMeeting(data.event)
        }
      } catch (error) {
        console.error('Failed to fetch current meeting:', error)
      }
    }

    fetchCurrentMeeting()
    // Refresh every minute to check for new meetings
    const interval = setInterval(fetchCurrentMeeting, 60000)
    return () => clearInterval(interval)
  }, [])


  const handleSubmit = async (e: React.FormEvent, overrideText?: string) => {
    e.preventDefault()
    const textToSubmit = overrideText || input.trim()
    if (!textToSubmit || isLoading) return

    const inputText = textToSubmit.trim()
    const lowerInput = inputText.toLowerCase()

    // Detect fix commands: "fix:", "fix that", "fix this", etc.
    const isFixCommand = lowerInput.startsWith('fix:') ||
      lowerInput.startsWith('fix that') ||
      lowerInput.startsWith('fix this') ||
      (lowerInput.startsWith('fix ') && (lowerInput.includes('should be') || lowerInput.includes('to ')))

    const userMessage: Message = {
      id: Date.now(),
      text: inputText,
      timestamp: new Date(),
      isUser: true,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Store user message in message log
      try {
        await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            role: 'user',
            content: inputText,
          }),
        })
      } catch (error) {
        console.error('Error storing message log:', error)
      }

      // First check if this is a general query (not just task query)
      let isGeneralQuery = false
      try {
        const queryIntentResponse = await fetch('/api/query/detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ message: inputText }),
        })

        if (queryIntentResponse.ok) {
          const queryIntentResult = await queryIntentResponse.json()
          isGeneralQuery = queryIntentResult.isQuery === true
        }
      } catch (error) {
        console.error('Error detecting general query intent:', error)
      }

      // Handle general queries (search across all databases)
      if (isGeneralQuery) {
        try {
          const queryResponse = await fetch('/api/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ query: inputText }),
          })

          if (!queryResponse.ok) {
            throw new Error('Failed to execute query')
          }

          const queryResult = await queryResponse.json()

          const botMessage: Message = {
            id: Date.now() + 1,
            text: queryResult.total_results === 0
              ? `No results found for "${inputText}"`
              : `Found ${queryResult.total_results} result${queryResult.total_results !== 1 ? 's' : ''} for "${inputText}"`,
            queryResults: queryResult.results,
            timestamp: new Date(),
            isUser: false,
          }

          setMessages((prev) => [...prev, botMessage])
          setIsLoading(false)
          return
        } catch (error) {
          console.error('Error executing query:', error)
          // Fall through to normal capture if query fails
        }
      }

      // Use LLM to detect if this is a query about existing tasks vs creating a new task
      let intentResult = { isQuery: false, type: null as 'today' | 'date' | null, date: undefined as string | undefined }

      try {
        const intentResponse = await fetch('/api/intent/detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ message: inputText }),
        })

        // Check if we were redirected (e.g., to login page)
        if (intentResponse.redirected || intentResponse.url.includes('/auth/signin')) {
          throw new Error('Intent detection API redirected to auth page')
        }

        if (intentResponse.ok) {
          intentResult = await intentResponse.json()
        } else {
          const errorText = await intentResponse.text()
          console.warn('⚠️ Intent detection failed:', intentResponse.status, errorText)
        }
      } catch (intentError) {
        console.error('❌ Error calling intent detection API:', intentError)
        // Continue with normal capture if intent detection fails
      }

      // Handle MCP tool queries (list tasks) - use LLM detection
      if (intentResult.isQuery && intentResult.type) {
        let toolName = ''
        let parameters: any = {}

        if (intentResult.type === 'today') {
          toolName = 'list_tasks_due_today'
        } else if (intentResult.type === 'date' && intentResult.date) {
          toolName = 'list_tasks_due_on_date'
          parameters = { date: intentResult.date }
        }

        if (toolName) {
          const mcpResponse = await fetch('/api/mcp/tools', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tool: toolName,
              parameters,
            }),
          })

          if (!mcpResponse.ok) {
            throw new Error('Failed to fetch tasks')
          }

          const mcpResult = await mcpResponse.json()

          // Format the response
          let responseText = ''
          const dateLabel = intentResult.type === 'today' ? 'due today' : `due on ${intentResult.date}`

          if (mcpResult.count === 0) {
            responseText = `📋 No tasks found ${dateLabel}.`
          } else {
            responseText = `📋 Found ${mcpResult.count} task${mcpResult.count === 1 ? '' : 's'} ${dateLabel}:\n\n`
            mcpResult.tasks.forEach((task: any, index: number) => {
              responseText += `${index + 1}. **${task.name}**`
              if (task.status && task.status !== 'Todo') {
                responseText += ` [${task.status}]`
              }
              if (task.notes) {
                responseText += `\n   💬 ${task.notes}`
              }
              responseText += '\n'
            })
            responseText += `\n👉 Click "View →" below to see all tasks on the admin page`
          }

          const botMessage: Message = {
            id: Date.now() + 1,
            text: responseText,
            result: {
              success: true,
              category: 'admin' as any,
              destinationName: `${mcpResult.count} tasks`,
              destinationUrl: mcpResult.navigationUrl,
              confidence: 1,
              message: responseText,
              logId: 0, // Not from inbox log
            },
            timestamp: new Date(),
            isUser: false,
          }

          setMessages((prev) => [...prev, botMessage])
          setIsLoading(false)
          return
        }
      }

      if (isFixCommand) {
        // CRITICAL: Never process fix commands as normal captures
        // Handle fix command - find the last capture result
        const lastBotMessage = [...messages].reverse().find(m => !m.isUser && m.result && m.result.logId)

        if (!lastBotMessage || !lastBotMessage.result || !lastBotMessage.result.logId) {
          const errorMessage: Message = {
            id: Date.now() + 1,
            text: '❌ No previous capture found to fix. Please capture something first, then use the fix command.',
            timestamp: new Date(),
            isUser: false,
          }
          setMessages((prev) => [...prev, errorMessage])
          setIsLoading(false)
          return
        }

        // Extract category from fix command - handle various formats
        // Remove "fix:", "fix that", "fix this", etc. and get the category part
        let fixText = inputText
          .replace(/^fix:\s*/i, '')
          .replace(/^fix\s+(that|this)\s+/i, '')
          .replace(/^fix\s+/i, '')
          .trim()

        // Extract category - look for "should be X" or "to X" patterns
        let categoryMatch = fixText.match(/(?:should be|to)\s+(\w+)/i)
        if (!categoryMatch) {
          // If no pattern match, try to find category word anywhere
          categoryMatch = fixText.match(/\b(people|projects|ideas|admin)\b/i)
        }

        // If no exact match, try fuzzy matching for common typos
        if (!categoryMatch) {
          const lowerFix = fixText.toLowerCase()
          // Common typos: poeple -> people, projecs -> projects, etc.
          if (lowerFix.includes('peopl') || lowerFix.includes('person')) {
            categoryMatch = ['people', 'people']
          } else if (lowerFix.includes('projec') || lowerFix.includes('project')) {
            categoryMatch = ['projects', 'projects']
          } else if (lowerFix.includes('idea') || lowerFix.includes('ide')) {
            categoryMatch = ['ideas', 'ideas']
          } else if (lowerFix.includes('admin') || lowerFix.includes('task') || lowerFix.includes('todo')) {
            categoryMatch = ['admin', 'admin']
          }
        }

        if (!categoryMatch) {
          const errorMessage: Message = {
            id: Date.now() + 1,
            text: '❌ Could not determine category from: "' + fixText + '"\n\nValid categories: people, projects, ideas, admin\n\nExample: fix: this should be people',
            timestamp: new Date(),
            isUser: false,
          }
          setMessages((prev) => [...prev, errorMessage])
          setIsLoading(false)
          return // CRITICAL: Return early to prevent normal capture
        }

        const newCategory = categoryMatch[1].toLowerCase()

        // Call fix API
        const fixResponse = await fetch('/api/fix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            logId: lastBotMessage.result.logId,
            category: newCategory
          }),
        })

        const fixResult = await fixResponse.json()

        if (fixResult.success) {
          const botMessage: Message = {
            id: Date.now() + 1,
            text: `✅ ${fixResult.message}${fixResult.destinationUrl ? `\n${fixResult.destinationUrl}` : ''}`,
            result: {
              success: true,
              category: fixResult.newCategory as any,
              destinationName: fixResult.destinationName,
              destinationUrl: fixResult.destinationUrl,
              confidence: 1,
              message: fixResult.message,
              logId: lastBotMessage.result.logId,
            },
            timestamp: new Date(),
            isUser: false,
          }
          setMessages((prev) => [...prev, botMessage])
          // Notify all components to refresh data
          notifyUpdate('all')
        } else {
          const errorMessage: Message = {
            id: Date.now() + 1,
            text: `❌ ${fixResult.message || fixResult.error || 'Failed to fix classification'}`,
            timestamp: new Date(),
            isUser: false,
          }
          setMessages((prev) => [...prev, errorMessage])
        }
        // CRITICAL: Always return after handling fix command
        setIsLoading(false)
        return
      } else {
        // Normal capture
        const response = await fetch('/api/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ message: inputText }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: response.statusText }))
          throw new Error(errorData?.error || errorData?.message || `Failed to capture: ${response.statusText}`)
        }

        const payload = await response.json()
        if (payload?.success === false) {
          throw new Error(payload?.error || payload?.message || 'Failed to capture message')
        }

        const result = payload as CaptureResult

        // Debug: Log extracted fields
        if (result.fields) {
          console.log('📋 Captured fields:', result.fields)
          if (result.fields.due_date) {
            console.log('📅 Due date captured:', result.fields.due_date)
          }
        }

        const botMessage: Message = {
          id: Date.now() + 1,
          text: result.message,
          result,
          timestamp: new Date(),
          isUser: false,
        }

        setMessages((prev) => [...prev, botMessage])

        // Store assistant message in message log
        try {
          await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              role: 'assistant',
              content: result.message,
              category: result.category,
              destinationUrl: result.destinationUrl,
            }),
          })
        } catch (error) {
          console.error('Error storing assistant message:', error)
        }

        // Notify all components to refresh data when a new item is created
        if (result.success && result.category && result.category !== 'Needs Review') {
          notifyUpdate(result.category as any)
          // Also notify 'all' to update any components that show aggregated data
          notifyUpdate('all')
        }
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: `❌ Error: ${error instanceof Error ? error.message : 'Failed to process message'}`,
        timestamp: new Date(),
        isUser: false,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-surface rounded-xl shadow-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-surface/50 backdrop-blur-sm">
        <h2 className="text-xl font-bold text-textPrimary tracking-tight">
          Capture Thoughts
        </h2>
        <p className="text-sm text-textMuted mt-1">
          Type any thought and I'll organize it for you
        </p>

        {/* Current Meeting Status Indicator */}
        <div className={`mt-4 p-3 rounded-xl border transition-all duration-300 ${currentMeeting
          ? 'bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(109,95,248,0.1)]'
          : 'bg-surfaceElevated border-border'
          }`}>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className={`w-2.5 h-2.5 rounded-full ${currentMeeting
                ? 'bg-primary animate-pulse shadow-[0_0_8px_#6D5EF8]'
                : 'bg-textMuted/30'
                }`}></div>
            </div>
            <div className="flex-1 min-w-0">
              {currentMeeting ? (
                <>
                  <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                    In Meeting
                  </p>
                  <p className="text-sm text-textPrimary font-medium truncate mt-0.5">
                    {currentMeeting.subject}
                  </p>
                  <p className="text-xs text-textMuted mt-0.5">
                    Until {new Date(currentMeeting.endTime).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </p>
                </>
              ) : (
                <p className="text-sm font-medium text-textMuted">
                  Not in a meeting
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
        {messages.length === 0 && (
          <div className="text-center text-textMuted py-12 flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-surfaceElevated flex items-center justify-center mb-4 border border-border">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="font-medium text-textPrimary">No messages yet</p>
            <p className="text-sm mt-1">Start by typing a thought or idea...</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${message.isUser
                ? 'bg-primary text-textPrimary rounded-tr-none shadow-[0_4px_15px_rgba(109,95,248,0.3)]'
                : 'bg-surfaceElevated text-textPrimary rounded-tl-none border border-border'
                }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
              {message.queryResults && message.queryResults.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <QueryResults
                    results={message.queryResults}
                    query={message.text}
                    total_results={message.queryResults.length}
                  />
                </div>
              )}
              {message.result && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  {/* Display captured fields */}
                  {message.result.fields && (() => {
                    const fields = message.result.fields
                    const items: Array<{ label: string; value: string; isTag?: boolean }> = []

                    // Helper to format date
                    const formatDate = (dateValue: any): string | null => {
                      if (!dateValue) return null
                      try {
                        let date: Date
                        if (typeof dateValue === 'string') {
                          if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                            date = new Date(dateValue + 'T00:00:00')
                          } else {
                            date = new Date(dateValue)
                          }
                        } else {
                          date = new Date(dateValue)
                        }
                        if (!isNaN(date.getTime())) {
                          const dateStr = date.toLocaleDateString()
                          const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                            return dateStr
                          }
                          return `${dateStr} ${timeStr}`
                        }
                      } catch (e) { }
                      return String(dateValue)
                    }

                    if (fields.due_date) {
                      const formatted = formatDate(fields.due_date)
                      if (formatted) items.push({ label: 'Due Date', value: formatted })
                    }

                    if (message.result.category && message.result.category !== 'Needs Review') {
                      items.push({
                        label: 'Category',
                        value: message.result.category.toString(),
                        isTag: true
                      })
                    }

                    if (items.length > 0) {
                      return (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {items.map((item, idx) => (
                            <div key={idx} className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${item.isTag ? 'bg-secondary/20 text-secondary border border-secondary/30' : 'bg-surface/50 text-textMuted'}`}>
                              {item.label}: {item.value}
                            </div>
                          ))}
                        </div>
                      )
                    }
                    return null
                  })()}

                  <div className="flex items-center justify-between mt-1">
                    {message.result.destinationUrl && (
                      <Link
                        href={message.result.destinationUrl.startsWith('http') ? message.result.destinationUrl : message.result.destinationUrl}
                        className="text-xs font-bold text-secondary hover:text-secondary/80 transition-colors flex items-center gap-1 group"
                      >
                        View Details
                        <svg className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    )}

                    {message.result.category === 'Needs Review' && (
                      <span className="text-[10px] font-bold text-highlight uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-highlight rounded-full animate-pulse"></span>
                        Low Confidence
                      </span>
                    )}
                  </div>
                </div>
              )}
              <div className="flex justify-between items-center mt-2">
                <p className="text-[10px] font-medium text-textMuted uppercase tracking-tighter">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                {message.isUser && (
                  <svg className="w-3 h-3 text-textPrimary/50" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-surfaceElevated border border-border rounded-2xl rounded-tl-none px-4 py-3">
              <div className="flex space-x-1.5">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-surface/80 backdrop-blur-md border-t border-border">
        <CapturePredictions
          onAccept={(prediction) => {
            setInput(prediction.content)
            // Optionally auto-submit
            setTimeout(() => {
              const form = document.querySelector('form') as HTMLFormElement
              if (form) {
                form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
              }
            }, 100)
          }}
        />
        <form onSubmit={handleSubmit} className="relative group">
          <SmartAutocomplete
            value={input}
            onChange={setInput}
            placeholder="Type your thought here..."
            className="w-full pl-4 pr-28 py-3 bg-surfaceElevated border border-border rounded-xl text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300"
            disabled={isLoading}
          />
          <div className="absolute right-2 top-2 flex items-center gap-1">
            {isVoiceSupported && (
              <button
                type="button"
                onClick={isListening ? stopVoiceInput : startVoiceInput}
                disabled={isLoading}
                className={`p-1.5 rounded-lg transition-all duration-300 ${
                  isListening
                    ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse'
                    : 'bg-surfaceElevated text-textMuted hover:text-textPrimary hover:bg-surface border border-border'
                } disabled:opacity-30 disabled:cursor-not-allowed`}
                title={isListening ? 'Stop recording' : 'Start voice input'}
              >
                {isListening ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>
            )}
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-1.5 bg-primary text-textPrimary rounded-lg hover:bg-primary/90 disabled:opacity-30 disabled:grayscale transition-all duration-300 shadow-lg shadow-primary/20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </form>
        <div className="flex items-center justify-end mt-2 px-1">
          <div className="flex gap-2">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surfaceElevated text-textMuted border border-border">fix: ...</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-surfaceElevated text-textMuted border border-border">today?</span>
          </div>
        </div>
      </div>
    </div>
  )
}
