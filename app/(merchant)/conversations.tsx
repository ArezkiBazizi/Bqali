import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { theme } from '../../constants/theme'
import { Conversation, getConversations } from '../../lib/chat'
import { supabase } from '../../lib/supabase'

export default function MerchantConversations() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const data = await getConversations(user.id, 'merchant')
      setConversations(data)
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    loadConversations()
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
      onPress={() => router.push(`/(merchant)/chat/${conversation.id}`)}
    >
      <View style={styles.conversationHeader}>
        <View style={styles.customerInfo}>
          <View style={styles.customerAvatar}>
            <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.customerDetails}>
            <Text style={styles.customerName} numberOfLines={1}>
              {conversation.customer?.email || 'Client'}
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

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
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
          <View style={styles.titleSection}>
            <Ionicons name="chatbubbles-outline" size={24} color={theme.colors.white} />
            <Text style={styles.headerTitle}>Conversations</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {conversations.length} conversation{conversations.length > 1 ? 's' : ''}
          </Text>
        </View>
      </LinearGradient>

      {/* Liste des conversations */}
      <View style={styles.conversationsSection}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="chatbubbles-outline" size={32} color={theme.colors.textMuted} />
            <Text style={styles.loadingText}>Chargement des conversations...</Text>
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucune conversation</Text>
            <Text style={styles.emptySubtitle}>
              Les messages de vos clients apparaîtront ici
            </Text>
          </View>
        ) : (
          <View style={styles.conversationsList}>
            {conversations.map(renderConversation)}
          </View>
        )}
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
  conversationsSection: {
    padding: theme.spacing.lg,
  },
  loadingContainer: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
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
    fontSize: 16,
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
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  bottomSpacing: {
    height: 100,
  },
}) 