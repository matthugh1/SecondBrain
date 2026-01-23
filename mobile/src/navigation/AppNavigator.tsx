import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import CaptureScreen from '../screens/CaptureScreen'
import DashboardScreen from '../screens/DashboardScreen'
import ItemsListScreen from '../screens/ItemsListScreen'
import ItemDetailScreen from '../screens/ItemDetailScreen'

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

function CaptureStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Capture"
        component={CaptureScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  )
}

function ItemsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ItemsList"
        component={ItemsListScreen}
        options={{ title: 'Items' }}
      />
      <Stack.Screen
        name="ItemDetail"
        component={ItemDetailScreen}
        options={{ title: 'Details' }}
      />
    </Stack.Navigator>
  )
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#6D5EF8',
          tabBarInactiveTintColor: '#666',
          tabBarStyle: {
            backgroundColor: '#1a1a1a',
            borderTopColor: '#2a2a2a',
          },
        }}
      >
        <Tab.Screen
          name="Capture"
          component={CaptureStack}
          options={{
            tabBarLabel: 'Capture',
            headerShown: false,
          }}
        />
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarLabel: 'Dashboard',
            headerShown: false,
          }}
        />
        <Tab.Screen
          name="Items"
          component={ItemsStack}
          options={{
            tabBarLabel: 'Items',
            headerShown: false,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  )
}
