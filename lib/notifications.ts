import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { supabase, supabaseEnvOk } from './supabase'

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export const registerForPushNotifications = async (): Promise<string | null> => {
  let token = null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    })
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.log('Permission de notification refusée')
    return null
  }

  // Expo exige un `projectId` (EAS) selon le workflow (managed/bare/dev client).
  // On tente de le récupérer depuis la config, sinon on évite de crasher l'app.
  const extra = (Constants.expoConfig?.extra ?? {}) as any
  const projectIdFromConfig =
    extra?.eas?.projectId ||
    (Constants as any)?.manifest?.extra?.eas?.projectId ||
    process.env.EXPO_EAS_PROJECT_ID ||
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID

  try {
    const tokenResult = projectIdFromConfig
      ? await Notifications.getExpoPushTokenAsync({ projectId: String(projectIdFromConfig) })
      : await Notifications.getExpoPushTokenAsync()

    token = tokenResult.data
    console.log('Token de notification:', token)
  } catch (e: any) {
    // Si le projetId EAS manque, on log et on continue (les notifications seront juste indisponibles).
    console.log("Impossible de récupérer le token Expo Push:", e?.message || e)
    token = null
  }

  return token
}

// Garde ce nom pour compatibilité avec les imports existants
export const registerForPushNotificationsAsync = registerForPushNotifications

export const upsertUserPushToken = async (userId: string, token: string): Promise<void> => {
  if (!supabaseEnvOk || !userId || !token) return

  // Essaye d'enregistrer le token si la table existe.
  // En cas d'absence de table/permissions, on log et on continue sans bloquer l'app.
  const { error } = await supabase
    .from('user_push_tokens')
    .upsert(
      {
        user_id: userId,
        expo_push_token: token,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (error) {
    console.log('Impossible d’enregistrer le token push:', error.message)
  }
}

export const scheduleNotification = async (
  title: string,
  body: string,
  seconds: number = 0
) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
    },
    // Certains types Expo Notifications varient selon la version.
    // On force le cast pour éviter un échec TS/Lint tout en gardant le format attendu.
    trigger: { type: 'timeInterval', seconds, repeats: false } as any,
  })
} 

// Envoi push côté client (simple) vers l'endpoint Expo.
// À utiliser uniquement si tu comprends les limites (pour la prod, un backend est recommandé).
export const sendExpoPushAsync = async (tokens: string[], title: string, body: string): Promise<void> => {
  if (!tokens || tokens.length === 0) return

  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: tokens,
        title,
        body,
        sound: true,
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.log('Erreur envoi push Expo:', res.status, text)
    }
  } catch (e: any) {
    console.log('Erreur envoi push Expo:', e?.message || e)
  }
}