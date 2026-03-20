import React from 'react'
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native'

interface IconButtonProps {
  label: string
  onPress: () => void
  style?: ViewStyle
  color?: string
  size?: number
}

export default function IconButton({ label, onPress, style, color = '#fff', size = 20 }: IconButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.btn, style]}>
      <Text style={{ color, fontSize: size }}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
}) 