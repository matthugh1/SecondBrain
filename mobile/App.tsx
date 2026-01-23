import React, { useEffect } from 'react'
import AppNavigator from './src/navigation/AppNavigator'
import SyncService from './src/services/sync'

export default function App() {
  useEffect(() => {
    // Start periodic sync
    const stopSync = SyncService.startPeriodicSync(30000) // Sync every 30 seconds

    return () => {
      stopSync()
    }
  }, [])

  return <AppNavigator />
}
