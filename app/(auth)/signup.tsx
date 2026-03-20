import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native'
import Button from '../../components/ui/Button'
import { toast } from '../../components/ui/Toast'
import { theme } from '../../constants/theme'
import { supabase, supabaseEnvOk } from '../../lib/supabase'

export default function Signup() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const onSignup = async () => {
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
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone },
        },
      })
      if (error) throw error
      toast('Vérifie ta boîte mail pour confirmer ✅')
      router.replace('/(auth)/login')
    } catch (e: any) {
      toast(e?.message || 'Erreur lors de la création du compte')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.header}> 
        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>Confirmez votre email pour activer votre compte</Text>
      </View>

      <View style={styles.form}> 
        <Text style={styles.label}>Nom complet</Text>
        <TextInput
          style={styles.input}
          placeholder="Votre nom"
          placeholderTextColor={theme.colors.textMuted}
          value={fullName}
          onChangeText={setFullName}
        />

        <Text style={styles.label}>Téléphone</Text>
        <TextInput
          style={styles.input}
          placeholder="06 12 34 56 78"
          placeholderTextColor={theme.colors.textMuted}
          keyboardType='phone-pad'
          value={phone}
          onChangeText={setPhone}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="vous@mail.com"
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

        <Button title={loading ? 'Création…' : 'Créer le compte'} onPress={onSignup} />
        <View style={{ height: 12 }} />
        <Button title="J’ai déjà un compte" variant="secondary" onPress={() => router.push('/(auth)/login')} />
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