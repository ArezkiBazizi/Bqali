import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Button from '../../components/ui/Button'
import { toast } from '../../components/ui/Toast'
import { theme } from '../../constants/theme'
import { supabase, supabaseEnvOk } from '../../lib/supabase'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const onLogin = async () => {
    if (!supabaseEnvOk) {
      toast('Config Supabase manquante')
      return
    }
    if (!email || !password) {
      toast('Email et mot de passe requis')
      return
    }
    try {
      setLoading(true)
      // Dans login.tsx - Version sécurisée
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      // 2. Récupérer ou créer le profil
      let { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single()

      // 3. Si pas de profil, utiliser le rôle par défaut
      if (profileError && profileError.code === 'PGRST116') {
        const role = email.includes('boulangerie') ? 'merchant' : 'customer'
        profile = { role }
        
        // Optionnel : créer le profil (si RLS le permet)
        try {
          await supabase.from('users').insert({
            id: data.user.id,
            email: data.user.email,
            role: role
          })
        } catch (insertError) {
          // Ignorer l'erreur RLS, continuer avec le rôle par défaut
          console.log('Profil non créé, utilisation du rôle par défaut')
        }
      }

      // 4. Redirection selon le rôle
      if (profile?.role === 'merchant') {
        router.replace('/(merchant)/dashboard')
      } else {
        router.replace('/(customer)/home')
      }
    } catch (error: any) {
      toast(error?.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  const goToHome = () => {
    router.push('/(public)')
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      {/* Header avec bouton retour */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backButton} onPress={goToHome}>
          <Ionicons name="home-outline" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.header}> 
        <Text style={styles.title}>Connexion</Text>
        <Text style={styles.subtitle}>Retrouvez les meilleurs paniers près de vous</Text>
      </View>

      <View style={styles.form}> 
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="votre@email.com"
          placeholderTextColor={theme.colors.textMuted}
          autoCapitalize='none'
          keyboardType='email-address'
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          style={styles.input}
          placeholder="********"
          placeholderTextColor={theme.colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Button title={loading ? 'Connexion…' : 'Se connecter'} onPress={onLogin} />
        <View style={{ height: 12 }} />
        <Button title="Créer un compte" variant="secondary" onPress={() => router.push('/(auth)/signup')} />
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
    justifyContent: 'center',
  },
  topHeader: {
    position: 'absolute',
    top: 50,
    left: theme.spacing.lg,
    zIndex: 1,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    width: 40,
    height: 40,
    borderRadius: 20,
    ...theme.shadow.card,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: theme.colors.text,
  },
  subtitle: {
    color: theme.colors.textMuted,
    marginTop: 6,
  },
  form: {
    gap: theme.spacing.md,
  },
  label: {
    color: theme.colors.text,
    fontWeight: '700',
  },
  input: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.sm,
  },
})