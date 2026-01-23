import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import ApiService from '../services/api'

export default function ItemDetailScreen({ route }: any) {
  const [item, setItem] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(true)

  const { type, id } = route.params

  React.useEffect(() => {
    loadItem()
  }, [type, id])

  const loadItem = async () => {
    try {
      setLoading(true)
      const data = await ApiService.getItem(type, id)
      setItem(data)
    } catch (error) {
      console.error('Error loading item:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !item) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{item.name}</Text>
        {item.status && (
          <Text style={styles.status}>{item.status}</Text>
        )}
        {item.context && (
          <Text style={styles.context}>{item.context}</Text>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  status: {
    fontSize: 14,
    color: '#6D5EF8',
    marginBottom: 16,
  },
  context: {
    fontSize: 16,
    color: '#e0e0e0',
    lineHeight: 24,
  },
  loading: {
    color: '#999',
    textAlign: 'center',
    marginTop: 40,
  },
})
