import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Alert, Dimensions, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { theme } from '../../constants/theme'
import { Conversation, getConversations } from '../../lib/chat'
import { supabase } from '../../lib/supabase'

const { width } = Dimensions.get('window')

interface MerchantStats {
  activeBaskets: number
  todaySales: number
  totalRevenue: number
  merchantName: string
}

export default function MerchantDashboard() {
  const [stats, setStats] = useState<MerchantStats>({
    activeBaskets: 0,
    todaySales: 0,
    totalRevenue: 0,
    merchantName: ''
  })
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [conversationsLoading, setConversationsLoading] = useState(true)

  const loadStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Récupérer les informations du marchand avec l'ID
      const { data: merchant } = await supabase
        .from('merchants')
        .select('id, name')
        .eq('owner_id', user.id)
        .single()

      if (!merchant) {
        setStats(prev => ({ ...prev, merchantName: 'Mon Commerce' }))
        setLoading(false)
        return
      }

      // Récupérer les paniers actifs du marchand
      const { data: baskets } = await supabase
        .from('baskets')
        .select('id, sale_price, created_at')
        .eq('merchant_id', merchant.id)
        .eq('status', 'active')

      // Récupérer les réservations du jour
      const today = new Date().toISOString().split('T')[0]
      const basketIds = baskets?.map(b => b.id) || []
      
      let todayReservations: any[] = []
      if (basketIds.length > 0) {
        const { data: reservations } = await supabase
          .from('reservations')
          .select('amount_due')
          .in('basket_id', basketIds)
          .gte('created_at', today)
        todayReservations = reservations || []
      }

      setStats({
        activeBaskets: baskets?.length || 0,
        todaySales: todayReservations.length,
        totalRevenue: todayReservations.reduce((sum, r) => sum + (r.amount_due || 0), 0),
        merchantName: merchant.name || 'Mon Commerce'
      })
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const data = await getConversations(user.id, 'merchant')
      setConversations(data.slice(0, 3)) // Limiter à 3 conversations récentes
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error)
    } finally {
      setConversationsLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
    loadConversations()
  }, [])

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
            router.replace('/(auth)/login')
          }
        }
      ]
    )
  }

  const navigateToBaskets = () => {
    router.push('/(merchant)/baskets')
  }

  const navigateToConversations = () => {
    router.push('/(merchant)/conversations')
  }

  const navigateToChat = (conversationId: string) => {
    router.push(`/(merchant)/chat/${conversationId}`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    } else if (diffInHours < 168) { // 7 jours
      return date.toLocaleDateString('fr-FR', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short'
      })
    }
  }

  const renderConversation = (conversation: Conversation) => (
    <TouchableOpacity
      key={conversation.id}
      style={styles.conversationItem}
      onPress={() => navigateToChat(conversation.id)}
    >
      <View style={styles.conversationHeader}>
        <View style={styles.customerInfo}>
          <View style={styles.customerAvatar}>
            <Ionicons name="person-outline" size={16} color={theme.colors.primary} />
          </View>
          <View style={styles.customerDetails}>
            <Text style={styles.customerName} numberOfLines={1}>
              {conversation.customer?.email}
            </Text>
            {conversation.basket && (
              <Text style={styles.basketTitle} numberOfLines={1}>
                {conversation.basket.title}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.conversationMeta}>
          <Text style={styles.lastMessageTime}>
            {conversation.last_message ? formatDate(conversation.last_message.created_at) : ''}
          </Text>
          {conversation.unread_count && conversation.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{conversation.unread_count}</Text>
            </View>
          )}
        </View>
      </View>

      {conversation.last_message && (
        <Text style={styles.lastMessage} numberOfLines={1}>
          {conversation.last_message.content}
        </Text>
      )}
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <Ionicons name="leaf-outline" size={32} color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    )
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={() => {
          loadStats()
          loadConversations()
        }} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header avec gradient */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.welcomeSection}>
            <View style={styles.greetingContainer}>
              <Ionicons name="leaf" size={24} color={theme.colors.white} />
              <Text style={styles.greeting}>Bonjour !</Text>
            </View>
            <Text style={styles.merchantName}>{stats.merchantName}</Text>
            <Text style={styles.subtitle}>Votre tableau de bord agricole</Text>
          </View>
          
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={theme.colors.white} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Statistiques avec design moderne */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Aperçu de votre activité</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="basket-outline" size={24} color={theme.colors.primary} />
            </View>
            <Text style={styles.statNumber}>{stats.activeBaskets}</Text>
            <Text style={styles.statLabel}>Paniers actifs</Text>
            <View style={styles.statTrend}>
              <Ionicons name="trending-up" size={16} color={theme.colors.success} />
              <Text style={styles.trendText}>+12%</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="calendar-outline" size={24} color={theme.colors.teal} />
            </View>
            <Text style={styles.statNumber}>{stats.todaySales}</Text>
            <Text style={styles.statLabel}>{`Ventes aujourd'hui`}</Text>
            <View style={styles.statTrend}>
              <Ionicons name="trending-up" size={16} color={theme.colors.success} />
              <Text style={styles.trendText}>+8%</Text>
            </View>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="cash-outline" size={24} color={theme.colors.accent} />
            </View>
            <Text style={styles.statNumber}>{stats.totalRevenue}</Text>
            <Text style={styles.statLabel}>{`Chiffre d'affaires`}</Text>
            <View style={styles.statTrend}>
              <Ionicons name="trending-up" size={16} color={theme.colors.success} />
              <Text style={styles.trendText}>+15%</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Conversations récentes */}
      <View style={styles.conversationsSection}>
        <View style={styles.conversationsHeader}>
          <Text style={styles.sectionTitle}>Messages récents</Text>
          <TouchableOpacity onPress={navigateToConversations}>
            <Text style={styles.seeAllBtn}>Voir tout</Text>
          </TouchableOpacity>
        </View>
        
        {conversationsLoading ? (
          <View style={styles.conversationsLoading}>
            <Ionicons name="chatbubbles-outline" size={32} color={theme.colors.textMuted} />
            <Text style={styles.conversationsLoadingText}>Chargement des conversations...</Text>
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.emptyConversations}>
            <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.textMuted} />
            <Text style={styles.emptyConversationsTitle}>Aucun message</Text>
            <Text style={styles.emptyConversationsSubtitle}>
              Les messages de vos clients apparaîtront ici
            </Text>
          </View>
        ) : (
          <View style={styles.conversationsList}>
            {conversations.map(renderConversation)}
          </View>
        )}
      </View>

      {/* Actions rapides */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={navigateToBaskets}>
            <LinearGradient
              colors={[theme.colors.primaryMuted, theme.colors.primary]}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="add-circle-outline" size={32} color={theme.colors.white} />
              <Text style={styles.actionTitle}>Gérer mes paniers</Text>
              <Text style={styles.actionSubtitle}>Créer, modifier, supprimer</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => router.push('/(merchant)/analytics')}
          >
            <LinearGradient
              colors={[theme.colors.teal, theme.colors.tealDark]}
              style={styles.actionGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="analytics-outline" size={32} color={theme.colors.white} />
              <Text style={styles.actionTitle}>Statistiques</Text>
              <Text style={styles.actionSubtitle}>Analyses détaillées</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Conseils agricoles */}
      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>Conseils du jour</Text>
        
        <View style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <Ionicons name="bulb-outline" size={24} color={theme.colors.accent} />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Optimisez vos créneaux</Text>
            <Text style={styles.tipText}>
              Proposez vos paniers entre 17h et 19h pour maximiser vos ventes. 
              Les clients préfèrent récupérer après le travail.
            </Text>
          </View>
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  welcomeSection: {
    flex: 1,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.white,
    marginLeft: theme.spacing.sm,
  },
  merchantName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.white,
    opacity: 0.9,
  },
  logoutBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsSection: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  statCard: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    flex: 1,
    ...theme.shadow.card,
    borderWidth: 1,
    borderColor: theme.colors.primaryMuted,
  },
  statIconContainer: {
    backgroundColor: theme.colors.primaryMuted,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.sm,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  trendText: {
    fontSize: 12,
    color: theme.colors.success,
    fontWeight: '600',
  },
  conversationsSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  conversationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  seeAllBtn: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  conversationsLoading: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  conversationsLoadingText: {
    marginTop: theme.spacing.md,
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  emptyConversations: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  emptyConversationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyConversationsSubtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  conversationsList: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    ...theme.shadow.card,
  },
  conversationItem: {
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerAvatar: {
    backgroundColor: theme.colors.primaryMuted,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    marginRight: theme.spacing.md,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  basketTitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  conversationMeta: {
    alignItems: 'flex-end',
  },
  lastMessageTime: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.pill,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
  unreadCount: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  lastMessage: {
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  actionsSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  actionsGrid: {
    gap: theme.spacing.md,
  },
  actionCard: {
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    ...theme.shadow.card,
  },
  actionGradient: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  actionSubtitle: {
    fontSize: 14,
    color: theme.colors.white,
    opacity: 0.9,
  },
  tipsSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  tipCard: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...theme.shadow.card,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accent,
  },
  tipIcon: {
    backgroundColor: theme.colors.accent + '20',
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    marginRight: theme.spacing.md,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  tipText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 100,
  },
})