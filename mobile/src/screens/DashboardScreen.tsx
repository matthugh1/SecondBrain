import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import ApiService from '../services/api'

export default function DashboardScreen() {
  const [stats, setStats] = React.useState({
    people: 0,
    projects: 0,
    ideas: 0,
    tasks: 0,
  })

  React.useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [people, projects, ideas, tasks] = await Promise.all([
        ApiService.getItems('people'),
        ApiService.getItems('projects'),
        ApiService.getItems('ideas'),
        ApiService.getItems('admin'),
      ])

      setStats({
        people: people.length,
        projects: projects.length,
        ideas: ideas.length,
        tasks: tasks.length,
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.people}</Text>
          <Text style={styles.statLabel}>People</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.projects}</Text>
          <Text style={styles.statLabel}>Projects</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.ideas}</Text>
          <Text style={styles.statLabel}>Ideas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.tasks}</Text>
          <Text style={styles.statLabel}>Tasks</Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 20,
    margin: '1%',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6D5EF8',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
})
