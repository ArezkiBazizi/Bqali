import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useState } from 'react'
import {
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'
import { toast } from '../../components/ui/Toast'
import { theme } from '../../constants/theme'
import { api } from '../../lib/api'

export default function VerifyReservation() {
  const { reservationId } = useLocalSearchParams<{ reservationId: string }>()
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  const verifyCode = async () => {
    if (!code || code.length !== 6) {
      toast('Veuillez entrer un code à 6 chiffres')
      return
    }

    try {
      setLoading(true)
      const data = await api.verifyReservationEmail(reservationId, code)

      if (data) {
        toast('Code vérifié avec succès !')
        router.replace(`/(customer)/reservation/${reservationId}`)
      } else {
        toast('Code incorrect')
      }
    } catch (error) {
      console.error('Erreur de vérification:', error)
      toast('Code incorrect ou expiré')
    } finally {
      setLoading(false)
    }
  }

  const resendCode = async () => {
    try {
      setLoading(true)
      await api.resendVerificationEmail(reservationId)
      toast('Nouveau code envoyé par email ✅')
    } catch (e) {
      toast('Impossible de renvoyer le code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      {/* Header avec gradient */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <Ionicons name="mail-outline" size={24} color={theme.colors.white} />
            <Text style={styles.headerTitle}>Vérification par email</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Entrez le code reçu par email
          </Text>
        </View>
      </LinearGradient>

      {/* Contenu principal */}
      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail-outline" size={48} color={theme.colors.primary} />
          </View>
          
          <Text style={styles.title}>Vérifiez votre email</Text>
          <Text style={styles.subtitle}>
            Nous avons envoyé un code de vérification à 6 chiffres à votre adresse email.
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Code de vérification</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="123456"
              value={code}
              onChangeText={setCode}
              keyboardType="numeric"
              maxLength={6}
              textAlign="center"
              autoFocus
            />
          </View>

          <TouchableOpacity 
            style={[styles.verifyBtn, loading && styles.disabledBtn]} 
            onPress={verifyCode}
            disabled={loading}
          >
            <Text style={styles.verifyBtnText}>
              {loading ? 'Vérification...' : 'Vérifier le code'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resendBtn} onPress={resendCode}>
            <Text style={styles.resendBtnText}>Renvoyer le code</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  headerContent: {
    alignItems: 'center',
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginLeft: theme.spacing.sm,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  iconContainer: {
    backgroundColor: theme.colors.primaryMuted,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  inputContainer: {
    width: '100%',
    marginBottom: theme.spacing.xl,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  codeInput: {
    backgroundColor: theme.colors.background,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    letterSpacing: 4,
  },
  verifyBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    width: '100%',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  disabledBtn: {
    backgroundColor: theme.colors.textMuted,
  },
  verifyBtnText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendBtn: {
    paddingVertical: theme.spacing.md,
  },
  resendBtnText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
}) 