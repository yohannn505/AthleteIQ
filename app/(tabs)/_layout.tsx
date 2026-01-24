import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#22d3ee',
      tabBarInactiveTintColor: '#64748b',
      tabBarStyle: {
        backgroundColor: '#0f172a',
        borderTopColor: '#1e293b',
        height: 85,
        paddingBottom: 25, 
      },
      headerShown: false, 
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="flash" size={24} color={color} />,
        }}
      />
      
      {/* Explore and Discover have been removed to keep the UI clean for your showcase */}

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
