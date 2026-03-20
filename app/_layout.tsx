import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack, useRouter } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { ToastViewport } from '../components/ui/Toast'
import { theme } from '../constants/theme'
import { registerForPushNotificationsAsync, upsertUserPushToken } from '../lib/notifications'
import { useAppStore } from '../lib/store'
import { supabase, supabaseEnvOk } from '../lib/supabase'

const queryClient = new QueryClient()

export default function RootLayout() {
  const { setUser, setUserRole, user, userRole } = useAppStore()
  const router = useRouter()

  useEffect(() => {
    if (!supabaseEnvOk) return

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user)

        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setUserRole(profile.role)
        }

        const token = await registerForPushNotificationsAsync()
        if (token) await upsertUserPushToken(session.user.id, token)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setUserRole(null)
      }
    })

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        
        // Récupérer le rôle de l'utilisateur
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setUserRole(profile.role)
        }
        
        const token = await registerForPushNotificationsAsync()
        if (token) await upsertUserPushToken(session.user.id, token)
      }
    })

    return () => {
      authListener?.subscription?.unsubscribe?.()
    }
  }, [])

  // Redirection automatique selon le rôle
  useEffect(() => {
    if (user && userRole) {
      // Attendre un peu pour éviter les conflits de navigation
      const timer = setTimeout(() => {
        if (userRole === 'merchant') {
          router.replace('/(merchant)/dashboard')
        } else if (userRole === 'admin') {
          router.replace('/(customer)/home') // Temporaire
        } else {
          router.replace('/(customer)/home')
        }
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [user, userRole])

  return (
    <QueryClientProvider client={queryClient}>
      <Stack screenOptions={{
        headerStyle: { backgroundColor: theme.colors.teal },
        headerTintColor: theme.colors.white,
        headerTitleStyle: { fontWeight: '800' },
        contentStyle: { backgroundColor: theme.colors.background },
      }} />
      <ToastViewport />
      <StatusBar style="light" />
    </QueryClientProvider>
  )
}
