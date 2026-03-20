import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
    Dimensions,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { theme } from '../../constants/theme'
import { Conversation, getConversations } from '../../lib/chat'
import { supabase } from '../../lib/supabase'

const { width } = Dimensions.get('window')

export default function Conversations() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadConversations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const data = await getConversations(user.id, 'customer')
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

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationCard}
      onPress={() => router.push(`/(customer)/chat/${item.id}`)}
    >
      <View style={styles.conversationHeader}>
        <View style={styles.merchantInfo}>
          <View style={styles.merchantAvatar}>
            <Ionicons name="storefront-outline" size={24} color={theme.colors.primary} />
          </View>
          <View style={styles.merchantDetails}>
            <Text style={styles.merchantName}>{item.merchant?.name}</Text>
            <Text style={styles.merchantAddress}>{item.merchant?.address}</Text>
          </View>
        </View>
        
        <View style={styles.conversationMeta}>
          <Text style={styles.lastMessageTime}>
            {item.last_message ? formatDate(item.last_message.created_at) : ''}
          </Text>
          {item.unread_count && item.unread_count > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unread_count}</Text>
            </View>
          )}
        </View>
      </View>

      {item.basket && (
        <View style={styles.basketInfo}>
          <Ionicons name="basket-outline" size={16} color={theme.colors.textMuted} />
          <Text style={styles.basketTitle}>{item.basket.title}</Text>
        </View>
      )}

      {item.last_message && (
        <Text style={styles.lastMessage} numberOfLines={2}>
          {item.last_message.content}
        </Text>
      )}
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <Ionicons name="chatbubbles-outline" size={32} color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des conversations...</Text>
        </View>
      </View>
    )
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
            <Ionicons name="chatbubbles-outline" size={24} color={theme.colors.white} />
            <Text style={styles.headerTitle}>Mes conversations</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {conversations.length} conversation{conversations.length > 1 ? 's' : ''}
          </Text>
        </View>
      </LinearGradient>

      {/* Liste des conversations */}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={theme.colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucune conversation</Text>
            <Text style={styles.emptySubtitle}>
              Vos conversations avec les commerçants apparaîtront ici
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
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
  listContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  conversationCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  merchantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  merchantAvatar: {
    backgroundColor: theme.colors.primaryMuted,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    marginRight: theme.spacing.md,
  },
  merchantDetails: {
    flex: 1,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  merchantAddress: {
    fontSize: 12,
    color: theme.colors.textMuted,
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
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xs,
  },
  unreadCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  basketInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  basketTitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  lastMessage: {
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 20,
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
})