import ApiService from './api'
import OfflineStorage from '../storage/offline-storage'

class SyncService {
  private isSyncing = false

  /**
   * Check if device is online
   * Note: Install @react-native-community/netinfo for production
   */
  async isOnline(): Promise<boolean> {
    // Simple check - try to ping API
    try {
      // Use a lightweight endpoint check
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
      await fetch(ApiService.baseURL || 'http://localhost:3000', {
        method: 'HEAD',
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return true
    } catch {
      return false
    }
  }

  /**
   * Sync offline captures
   */
  async syncOfflineCaptures(): Promise<{ synced: number; errors: number }> {
    if (this.isSyncing) {
      return { synced: 0, errors: 0 }
    }

    const isOnline = await this.isOnline()
    if (!isOnline) {
      return { synced: 0, errors: 0 }
    }

    this.isSyncing = true
    const unsynced = await OfflineStorage.getUnsyncedCaptures()
    let synced = 0
    let errors = 0

    for (const capture of unsynced) {
      try {
        await ApiService.capture(capture.message)
        await OfflineStorage.markSynced(capture.id)
        synced++
      } catch (error) {
        console.error('Error syncing capture:', error)
        errors++
      }
    }

    // Cleanup synced captures
    await OfflineStorage.cleanupSyncedCaptures()

    this.isSyncing = false
    return { synced, errors }
  }

  /**
   * Start periodic sync
   */
  startPeriodicSync(intervalMs: number = 30000): () => void {
    const interval = setInterval(() => {
      this.syncOfflineCaptures()
    }, intervalMs)

    return () => clearInterval(interval)
  }
}

export default new SyncService()
