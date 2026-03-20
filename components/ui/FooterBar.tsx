import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { supabase } from '../../lib/supabase'

export default function FooterBar() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<'customer' | 'merchant' | null>(null)
  const [activeTab, setActiveTab] = useState('discover')

  useEffect(() => {
    const getUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        setUserRole(profile?.role || 'customer')
      }
    }
    getUserRole()
  }, [])

  const tabs = [
    { id: 'discover', label: 'Découvrir', icon: 'compass-outline' },
    { id: 'cart', label: 'Panier', icon: 'basket-outline' },
    { id: 'messages', label: 'Messages', icon: 'chatbubbles-outline' },
    { id: 'favorites', label: 'Favoris', icon: 'heart-outline' },
    { id: 'profile', label: 'Profil', icon: 'person-outline' }
  ]

  const handleTabPress = (tabId: string) => {
    setActiveTab(tabId)
    
    switch (tabId) {
      case 'discover':
        router.push('/(public)')
        break
      case 'cart':
        if (userRole === 'customer') {
          router.push('/(customer)/cart')
        } else {
          router.push('/(auth)/login')
        }
        break
      case 'messages':
        if (userRole === 'customer') {
          router.push('/(customer)/conversations')
        } else if (userRole === 'merchant') {
          router.push('/(merchant)/conversations')
        } else {
          router.push('/(auth)/login')
        }
        break
      case 'favorites':
        if (userRole === 'customer') {
          router.push('/(customer)/favorites')
        } else {
          router.push('/(auth)/login')
        }
        break
      case 'profile':
        if (userRole === 'merchant') {
          router.push('/(merchant)/dashboard')
        } else if (userRole === 'customer') {
          router.push('/(customer)/profile')
        } else {
          router.push('/(auth)/login')
        }
        break
    }
  }

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={styles.tab}
          onPress={() => handleTabPress(tab.id)}
        >
          <Ionicons
            name={tab.icon as any}
            size={24}
            color={activeTab === tab.id ? '#2E7D32' : '#999999'}
          />
          <Text style={[
            styles.label,
            { color: activeTab === tab.id ? '#2E7D32' : '#999999' }
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
})