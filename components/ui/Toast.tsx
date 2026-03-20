import React, { useEffect, useRef, useState } from 'react'
import { Animated, Easing, StyleSheet, Text, View } from 'react-native'
import { theme } from '../../constants/theme'

let pushToastFn: ((msg: string) => void) | null = null
let pendingToastMsg: string | null = null

export function ToastViewport() {
  const [message, setMessage] = useState<string | null>(null)
  const translateY = useRef(new Animated.Value(-80)).current

  useEffect(() => {
    pushToastFn = (msg: string) => {
      setMessage(msg)
      Animated.sequence([
        Animated.timing(translateY, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.delay(1800),
        Animated.timing(translateY, { toValue: -80, duration: 180, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]).start(() => setMessage(null))
    }

    // Si un toast a été déclenché avant le montage complet du viewport,
    // on l'affiche dès que possible.
    if (pendingToastMsg) {
      pushToastFn?.(pendingToastMsg)
      pendingToastMsg = null
    }

    return () => { pushToastFn = null }
  }, [])

  if (!message) return null

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <Animated.View style={[styles.toast, { transform: [{ translateY }] }]}> 
        <Text style={styles.text}>{message}</Text>
      </Animated.View>
    </View>
  )
}

export function toast(msg: string) {
  if (pushToastFn) {
    pushToastFn(msg)
  } else {
    pendingToastMsg = msg
  }
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  toast: {
    marginTop: 12,
    backgroundColor: theme.colors.tealDark,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.pill,
    ...theme.shadow.card,
  },
  text: {
    color: theme.colors.white,
    fontWeight: '700',
  },
}) 