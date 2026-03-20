import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'

// Tente plusieurs emplacements possibles pour extra selon l’environnement Expo Go / Dev Client
const extraFromConstants = (Constants.expoConfig?.extra as Record<string, string> | undefined)
  || ((Constants as any)?.manifest?.extra as Record<string, string> | undefined)
  || ((Constants as any)?.manifest2?.extra?.expoClient?.extra as Record<string, string> | undefined)

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || extraFromConstants?.EXPO_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || extraFromConstants?.EXPO_PUBLIC_SUPABASE_ANON_KEY

export const supabaseEnvOk = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

export const supabase = supabaseEnvOk
  ? createClient(
      SUPABASE_URL as string,
      SUPABASE_ANON_KEY as string,
      { auth: { persistSession: true, autoRefreshToken: true } }
    )
  : (null as unknown as ReturnType<typeof createClient>) 