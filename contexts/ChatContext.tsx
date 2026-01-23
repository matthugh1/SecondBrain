'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import type { CaptureResult } from '@/lib/services/capture'
import type { QueryResult } from '@/components/QueryResults'

export interface Message {
  id: number
  text: string
  result?: CaptureResult
  queryResults?: QueryResult[]
  timestamp: Date
  isUser: boolean
}

interface ChatContextType {
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  addMessage: (message: Message) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([])

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message])
  }

  return (
    <ChatContext.Provider value={{ messages, setMessages, addMessage }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChat() {
  const context = useContext(ChatContext)
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}
