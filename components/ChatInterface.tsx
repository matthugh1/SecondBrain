'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useChat } from '@/contexts/ChatContext'
import { useDataUpdate } from '@/contexts/DataUpdateContext'
import type { Message } from '@/contexts/ChatContext'
import type { CaptureResult } from '@/lib/services/capture'

export default function ChatInterface() {
  const { messages, setMessages } = useChat()
  const { notifyUpdate } = useDataUpdate()
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const inputText = input.trim()
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
          body: JSON.stringify({ message: inputText }),
        })

        const payload = await response.json()
        if (!response.ok || payload?.success === false) {
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
        
        // Notify all components to refresh data when a new item is created
        if (result.success && result.category && result.category !== 'Needs Review') {
          notifyUpdate(result.category as any)
          // Also notify 'all' to update any components that show aggregated data
          notifyUpdate('all')
        }
      }
    } catch (error) {
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
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Capture Thoughts
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Type any thought and I'll organize it for you
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <p className="mb-2">No messages yet</p>
            <p className="text-sm">Start by typing a thought or idea...</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.isUser
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.text}</p>
              {message.result && (
                <div className="mt-2 pt-2 border-t border-gray-300 dark:border-gray-600">
                  {/* Display captured dates */}
                  {message.result.fields && (() => {
                    const fields = message.result.fields
                    const dates: Array<{ label: string; value: string }> = []
                    
                    // Helper to format date
                    const formatDate = (dateValue: any): string | null => {
                      if (!dateValue) return null
                      
                      try {
                        // Handle ISO date strings (YYYY-MM-DD)
                        let date: Date
                        if (typeof dateValue === 'string') {
                          // Check if it's just a date (YYYY-MM-DD) or includes time
                          if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                            // Just date, parse as UTC to avoid timezone issues
                            date = new Date(dateValue + 'T00:00:00')
                          } else {
                            date = new Date(dateValue)
                          }
                        } else {
                          date = new Date(dateValue)
                        }
                        
                        if (!isNaN(date.getTime())) {
                          // Format as readable date/time
                          const dateStr = date.toLocaleDateString()
                          const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          // If it's just a date (no time component), don't show time
                          if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
                            return dateStr
                          }
                          return `${dateStr} ${timeStr}`
                        }
                      } catch (e) {
                        console.warn('Failed to parse date:', dateValue, e)
                      }
                      
                      return String(dateValue)
                    }
                    
                    // Check for due_date (admin tasks)
                    if (fields.due_date) {
                      const formatted = formatDate(fields.due_date)
                      if (formatted) {
                        dates.push({ label: 'Due Date', value: formatted })
                      }
                    }
                    
                    // Check for other date fields (created_at, updated_at, etc.)
                    Object.entries(fields).forEach(([key, value]) => {
                      if (key !== 'due_date' && (key.includes('date') || key.includes('Date')) && value) {
                        const formatted = formatDate(value)
                        if (formatted) {
                          const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                          dates.push({ label, value: formatted })
                        }
                      }
                    })
                    
                    if (dates.length > 0) {
                      return (
                        <div className="mb-2 space-y-1">
                          {dates.map((date, idx) => (
                            <p key={idx} className="text-xs opacity-90">
                              <span className="font-medium">{date.label}:</span> {date.value}
                            </p>
                          ))}
                        </div>
                      )
                    }
                    return null
                  })()}
                  {message.result.destinationUrl && (() => {
                    const url = message.result.destinationUrl
                    
                    // Check if it's an internal URL (starts with / or matches our base URL)
                    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
                    const isInternal = url.startsWith('/') || url.startsWith(baseUrl)
                    
                    if (isInternal) {
                      // Extract the path (remove base URL if present, ensure it starts with /)
                      let path = url.startsWith(baseUrl) 
                        ? url.replace(baseUrl, '') 
                        : url
                      
                      // Ensure path starts with /
                      if (!path.startsWith('/')) {
                        path = '/' + path
                      }
                      
                      // Use Next.js Link for internal navigation (preserves chat state)
                      return (
                        <Link
                          href={path}
                          className="text-xs underline opacity-90 hover:opacity-100"
                        >
                          View →
                        </Link>
                      )
                    } else {
                      // Use regular anchor for external URLs
                      return (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs underline opacity-90 hover:opacity-100"
                        >
                          View →
                        </a>
                      )
                    }
                  })()}
                  {message.result.category === 'Needs Review' && (
                    <p className="text-xs mt-1 opacity-75">
                      Confidence: {(message.result.confidence * 100).toFixed(0)}%
                    </p>
                  )}
                </div>
              )}
              <p className="text-xs opacity-75 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your thought here..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Press Enter to send • One message = one thought • Use "fix that should be [category]" to correct the last classification
        </p>
      </form>
    </div>
  )
}
