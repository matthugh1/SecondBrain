'use client'

import { createContext, useContext, useCallback, useEffect, useRef } from 'react'

type DatabaseType = 'people' | 'projects' | 'ideas' | 'admin' | 'all'

interface DataUpdateContextType {
  subscribe: (database: DatabaseType, callback: () => void) => () => void
  notifyUpdate: (database: DatabaseType) => void
}

const DataUpdateContext = createContext<DataUpdateContextType | undefined>(undefined)

export function DataUpdateProvider({ children }: { children: React.ReactNode }) {
  // Use a ref to store callbacks so we don't need to recreate the context value
  const subscribersRef = useRef<Map<DatabaseType, Set<() => void>>>(new Map())

  const subscribe = useCallback((database: DatabaseType, callback: () => void) => {
    if (!subscribersRef.current.has(database)) {
      subscribersRef.current.set(database, new Set())
    }
    subscribersRef.current.get(database)!.add(callback)

    // Return unsubscribe function
    return () => {
      const callbacks = subscribersRef.current.get(database)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          subscribersRef.current.delete(database)
        }
      }
    }
  }, [])

  const notifyUpdate = useCallback((database: DatabaseType) => {
    // Notify subscribers for the specific database
    const callbacks = subscribersRef.current.get(database)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback()
        } catch (error) {
          console.error('Error in data update callback:', error)
        }
      })
    }

    // Also notify 'all' subscribers
    const allCallbacks = subscribersRef.current.get('all')
    if (allCallbacks) {
      allCallbacks.forEach(callback => {
        try {
          callback()
        } catch (error) {
          console.error('Error in data update callback:', error)
        }
      })
    }
  }, [])

  return (
    <DataUpdateContext.Provider value={{ subscribe, notifyUpdate }}>
      {children}
    </DataUpdateContext.Provider>
  )
}

export function useDataUpdate() {
  const context = useContext(DataUpdateContext)
  if (context === undefined) {
    throw new Error('useDataUpdate must be used within a DataUpdateProvider')
  }
  return context
}
