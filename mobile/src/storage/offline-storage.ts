import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEYS = {
  CAPTURES: 'offline_captures',
  SYNC_QUEUE: 'sync_queue',
}

export interface OfflineCapture {
  id: string
  message: string
  timestamp: number
  synced: boolean
}

class OfflineStorage {
  /**
   * Store capture offline
   */
  async storeCapture(message: string): Promise<string> {
    const capture: OfflineCapture = {
      id: `capture_${Date.now()}_${Math.random()}`,
      message,
      timestamp: Date.now(),
      synced: false,
    }

    const captures = await this.getCaptures()
    captures.push(capture)
    await AsyncStorage.setItem(STORAGE_KEYS.CAPTURES, JSON.stringify(captures))

    return capture.id
  }

  /**
   * Get all offline captures
   */
  async getCaptures(): Promise<OfflineCapture[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CAPTURES)
    return data ? JSON.parse(data) : []
  }

  /**
   * Mark capture as synced
   */
  async markSynced(captureId: string): Promise<void> {
    const captures = await this.getCaptures()
    const capture = captures.find(c => c.id === captureId)
    if (capture) {
      capture.synced = true
      await AsyncStorage.setItem(STORAGE_KEYS.CAPTURES, JSON.stringify(captures))
    }
  }

  /**
   * Get unsynced captures
   */
  async getUnsyncedCaptures(): Promise<OfflineCapture[]> {
    const captures = await this.getCaptures()
    return captures.filter(c => !c.synced)
  }

  /**
   * Remove synced captures
   */
  async cleanupSyncedCaptures(): Promise<void> {
    const captures = await this.getCaptures()
    const unsynced = captures.filter(c => !c.synced)
    await AsyncStorage.setItem(STORAGE_KEYS.CAPTURES, JSON.stringify(unsynced))
  }
}

export default new OfflineStorage()
