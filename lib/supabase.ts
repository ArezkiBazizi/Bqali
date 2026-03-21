import { processLock } from '@supabase/auth-js'
import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'

// Tente plusieurs emplacements possibles pour extra selon l’environnement Expo Go / Dev Client
const extraFromConstants = (Constants.expoConfig?.extra as Record<string, string> | undefined)
  || ((Constants as any)?.manifest?.extra as Record<string, string> | undefined)
  || ((Constants as any)?.manifest2?.extra?.expoClient?.extra as Record<string, string> | undefined)

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || extraFromConstants?.EXPO_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || extraFromConstants?.EXPO_PUBLIC_SUPABASE_ANON_KEY

export const supabaseEnvOk = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

/**
 * Verrou auth côté processus (sans Navigator Lock API).
 * Sur Expo Web, le défaut de Supabase utilise `navigator.locks` + timeout + `steal`,
 * ce qui provoque des AbortError (« Lock broken by another request with the 'steal' option »)
 * quand getSession / refresh / onAuthStateChange se chevauchent.
 * `processLock` est prévu pour React Native et évite ce mécanisme.
 * @see https://github.com/supabase/supabase-js/issues/936
 */
export const supabase = supabaseEnvOk
  ? createClient(
      SUPABASE_URL as string,
      SUPABASE_ANON_KEY as string,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          /**
           * Importer `processLock` depuis `@supabase/auth-js` (pas seulement le barrel
           * `@supabase/supabase-js`) : sinon Metro peut laisser `lock` undefined et le
           * client retombe sur `navigatorLock` → AbortError « steal » sous charge.
           */
          lock: processLock,
        },
      }
    )
  : (null as unknown as ReturnType<typeof createClient>) 