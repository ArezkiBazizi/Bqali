import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'
import { theme } from '../constants/theme'
import { useAppStore } from '../lib/store'
import { supabase } from '../lib/supabase'

export default function Index() {
  const { user, userRole, setUser, setUserRole } = useAppStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setUser(session.user)
          
          // Récupérer le rôle
          const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single()

          if (profile) {
            setUserRole(profile.role)
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification auth:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, color: theme.colors.textMuted }}>Chargement...</Text>
      </View>
    )
  }

  // Redirection selon le statut de connexion et le rôle
  if (user && userRole === 'merchant') {
    return <Redirect href="/(merchant)/dashboard" />
  } else if (user && userRole === 'admin') {
    return <Redirect href="/(customer)/home" />
  } else if (user) {
    return <Redirect href="/(customer)/home" />
  } else {
    return <Redirect href="/(public)" />
  }
} 