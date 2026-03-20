import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native'
import { theme } from '../../constants/theme'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary'
  style?: ViewStyle
}

export default function Button({ title, onPress, variant = 'primary', style }: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.base, variant === 'primary' ? styles.primary : styles.secondary, style]}
      activeOpacity={0.9}
    >
      <Text style={variant === 'primary' ? styles.primaryText : styles.secondaryText}>{title}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: theme.colors.teal,
    ...theme.shadow.card,
  },
  primaryText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondary: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  secondaryText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
}) 