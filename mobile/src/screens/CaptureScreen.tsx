import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native'
import ApiService from '../services/api'
import OfflineStorage from '../storage/offline-storage'
import SyncService from '../services/sync'

export default function CaptureScreen() {
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isOffline, setIsOffline] = useState(false)

  React.useEffect(() => {
    // Check online status
    const checkOnline = async () => {
      const online = await SyncService.isOnline()
      setIsOffline(!online)
    }
    checkOnline()
    const interval = setInterval(checkOnline, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleCapture = async () => {
    if (!message.trim()) {
      return
    }

    setIsLoading(true)

    try {
      const isOnline = await SyncService.isOnline()

      if (isOnline) {
        // Capture online
        const result = await ApiService.capture(message)
        Alert.alert('Success', `Captured as ${result.category || 'item'}`)
        setMessage('')
      } else {
        // Store offline
        await OfflineStorage.storeCapture(message)
        Alert.alert('Saved Offline', 'Your capture will sync when you\'re online')
        setMessage('')
      }
    } catch (error: any) {
      // Fallback to offline storage
      await OfflineStorage.storeCapture(message)
      Alert.alert('Saved Offline', 'Your capture will sync when you\'re online')
      setMessage('')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Capture Thought</Text>
        {isOffline && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText}>Offline</Text>
          </View>
        )}
      </View>

      <TextInput
        style={styles.input}
        placeholder="What's on your mind?"
        placeholderTextColor="#999"
        value={message}
        onChangeText={setMessage}
        multiline
        textAlignVertical="top"
        editable={!isLoading}
      />

      <TouchableOpacity
        style={[styles.button, isLoading && styles.buttonDisabled]}
        onPress={handleCapture}
        disabled={isLoading || !message.trim()}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Capture</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  offlineBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offlineText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    color: '#e0e0e0',
    fontSize: 16,
    marginBottom: 20,
    minHeight: 200,
  },
  button: {
    backgroundColor: '#6D5EF8',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
