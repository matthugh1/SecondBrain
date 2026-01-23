import React from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native'
import ApiService from '../services/api'

export default function ItemsListScreen({ route, navigation }: any) {
  const [items, setItems] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  const itemType = route?.params?.type || 'people'

  React.useEffect(() => {
    loadItems()
  }, [itemType])

  const loadItems = async () => {
    try {
      setLoading(true)
      const data = await ApiService.getItems(itemType as any)
      setItems(data)
    } catch (error) {
      console.error('Error loading items:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderItem = ({ item }: any) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('ItemDetail', { type: itemType, id: item.id })}
    >
      <Text style={styles.itemName}>{item.name}</Text>
      {item.status && (
        <Text style={styles.itemStatus}>{item.status}</Text>
      )}
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={loadItems}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  list: {
    padding: 10,
  },
  item: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  itemStatus: {
    fontSize: 12,
    color: '#999',
  },
})
