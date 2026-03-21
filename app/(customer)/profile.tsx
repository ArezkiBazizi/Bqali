import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Button from '../../components/ui/Button'
import { toast } from '../../components/ui/Toast'
import { theme } from '../../constants/theme'
import { supabase } from '../../lib/supabase'

export default function Profile() {
  const [user, setUser] = useState<any>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      
      if (user) {
        setUser(user)
        setFullName(user.user_metadata?.full_name || '')
        setPhone(user.user_metadata?.phone || '')
        setEmail(user.email || '')
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error)
      setUser(null)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleUpdate = async () => {
    setLoading(true)
    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName, phone }
    })
    setLoading(false)
    if (!error) {
      toast('Profil mis à jour !')
      setEditing(false)
    } else {
      toast('Erreur lors de la mise à jour')
    }
  }

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut()
            setUser(null)
            toast('Déconnecté avec succès')
          }
        }
      ]
    )
  }

  const navigateToLogin = () => {
    router.push('/(auth)/login')
  }

  const navigateToSignup = () => {
    router.push('/(auth)/signup')
  }

  // Affichage de chargement
  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <Ionicons name="person-outline" size={32} color={theme.colors.primary} />
          <Text style={styles.loadingText}>{`Vérification de l'authentification...`}</Text>
        </View>
      </View>
    )
  }

  // Affichage de la page d'authentification si non connecté
  if (!user) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header avec gradient */}
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark]}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.titleSection}>
              <Ionicons name="person-outline" size={24} color={theme.colors.white} />
              <Text style={styles.headerTitle}>Mon compte</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              Connectez-vous pour accéder à votre profil
            </Text>
          </View>
        </LinearGradient>

        {/* Section d'authentification */}
        <View style={styles.authSection}>
          <View style={styles.authCard}>
            <View style={styles.authIcon}>
              <Ionicons name="lock-closed-outline" size={48} color={theme.colors.primary} />
            </View>
            
            <Text style={styles.authTitle}>Accès requis</Text>
            <Text style={styles.authSubtitle}>
              Vous devez être connecté pour accéder à votre profil et gérer vos réservations
            </Text>

            <View style={styles.authButtons}>
              <Button
                title="Se connecter"
                onPress={navigateToLogin}
                style={styles.authButton}
              />
              
              <Button
                title="Créer un compte"
                variant="secondary"
                onPress={navigateToSignup}
                style={styles.authButton}
              />
            </View>
          </View>
        </View>

        {/* Avantages de la connexion */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>Pourquoi se connecter ?</Text>
          
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.benefitText}>Réservez vos paniers préférés</Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.benefitText}>Suivez vos commandes en temps réel</Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.benefitText}>Chattez avec les commerçants</Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
              <Text style={styles.benefitText}>Accédez à votre historique</Text>
            </View>
          </View>
        </View>

        {/* Espacement pour le footer */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    )
  }

  // Affichage du profil si connecté
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header avec gradient */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <Ionicons name="person" size={24} color={theme.colors.white} />
            <Text style={styles.headerTitle}>Mon profil</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Gérez vos informations personnelles
          </Text>
        </View>
      </LinearGradient>

      {/* Informations du profil */}
      <View style={styles.profileSection}>
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatar}>
              <Ionicons name="person" size={32} color={theme.colors.white} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {fullName || 'Utilisateur'}
              </Text>
              <Text style={styles.profileEmail}>{email}</Text>
            </View>
          </View>

          <View style={styles.profileDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Nom complet :</Text>
              {editing ? (
                <TextInput
                  style={styles.detailInput}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Nom complet"
                />
              ) : (
                <Text style={styles.detailValue}>{fullName || 'Non renseigné'}</Text>
              )}
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Téléphone :</Text>
              {editing ? (
                <TextInput
                  style={styles.detailInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Téléphone"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.detailValue}>{phone || 'Non renseigné'}</Text>
              )}
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Email :</Text>
              <Text style={styles.detailValue}>{email}</Text>
            </View>
          </View>

          <View style={styles.profileActions}>
            {editing ? (
              <Button
                title={loading ? 'Enregistrement...' : 'Enregistrer'}
                onPress={handleUpdate}
              />
            ) : (
              <TouchableOpacity 
                style={styles.editBtn} 
                onPress={() => setEditing(true)}
              >
                <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.editBtnText}>Modifier les informations</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Actions du compte */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Actions du compte</Text>
        
        <View style={styles.actionsList}>
          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => router.push('/(customer)/reservations')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="receipt-outline" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Mes réservations</Text>
              <Text style={styles.actionSubtitle}>{`Voir l'historique de vos commandes`}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem}
            onPress={() => router.push('/(customer)/conversations')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="chatbubbles-outline" size={24} color={theme.colors.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Mes conversations</Text>
              <Text style={styles.actionSubtitle}>Discussions avec les commerçants</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bouton de déconnexion */}
      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={theme.colors.danger} />
          <Text style={styles.logoutBtnText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>

      {/* Espacement pour le footer */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingCard: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textMuted,
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
  authSection: {
    padding: theme.spacing.lg,
  },
  authCard: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  authIcon: {
    backgroundColor: theme.colors.primaryMuted,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    marginBottom: theme.spacing.lg,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  authSubtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.xl,
  },
  authButtons: {
    width: '100%',
    gap: theme.spacing.md,
  },
  authButton: {
    width: '100%',
  },
  benefitsSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  benefitsList: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadow.card,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.md,
  },
  benefitText: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  profileSection: {
    padding: theme.spacing.lg,
  },
  profileCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    ...theme.shadow.card,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  profileAvatar: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    marginRight: theme.spacing.lg,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  profileEmail: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  profileDetails: {
    marginBottom: theme.spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: '600',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  detailInput: {
    fontSize: 14,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    flex: 2,
  },
  profileActions: {
    alignItems: 'center',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryMuted,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    gap: theme.spacing.sm,
  },
  editBtnText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionsSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  actionsList: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    ...theme.shadow.card,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  actionIcon: {
    backgroundColor: theme.colors.primaryMuted,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    marginRight: theme.spacing.md,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  actionSubtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  logoutSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    gap: theme.spacing.sm,
    ...theme.shadow.card,
  },
  logoutBtnText: {
    color: theme.colors.danger,
    fontWeight: 'bold',
    fontSize: 16,
  },
  bottomSpacing: {
    height: 100,
  },
})