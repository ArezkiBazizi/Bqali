import { useRouter } from 'expo-router'
import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { theme } from '../../constants/theme'
import { useAppStore } from '../../lib/store'

export default function CartButton() {
  const router = useRouter()
  const count = useAppStore((s) => s.cart.reduce((acc, it) => acc + it.quantity, 0))

  return (
    <TouchableOpacity style={styles.container} onPress={() => router.push('/(customer)/cart')}>
      <Text style={styles.icon}>🧺</Text>
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  icon: {
    fontSize: 20,
    color: theme.colors.white,
    fontWeight: '900',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    color: '#1a1a1a',
    fontSize: 12,
    fontWeight: '800',
  },
}) 