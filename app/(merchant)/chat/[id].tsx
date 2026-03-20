import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import { theme } from '../../../constants/theme'
import { Conversation, getConversations, getMessages, markMessagesAsRead, sendMessage } from '../../../lib/chat'
import { supabase } from '../../../lib/supabase'

const { width, height } = Dimensions.get('window')

export default function MerchantChat() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const loadConversation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const conversations = await getConversations(user.id, 'merchant')
      const currentConversation = conversations.find(c => c.id === id)
      
      if (currentConversation) {
        setConversation(currentConversation)
        await loadMessages()
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la conversation:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async () => {
    try {
      const data = await getMessages(id!)
      setMessages(data)
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error)
    }
  }

  useEffect(() => {
    if (id) {
      loadConversation()
    }
  }, [id])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation) return

    try {
      setSending(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await sendMessage(conversation.id, user.id, 'merchant', newMessage.trim())
      setNewMessage('')
      await loadMessages()
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
    } finally {
      setSending(false)
    }
  }

  const renderMessage = ({ item }: { item: any }) => {
    const isMerchant = item.sender_type === 'merchant'
    
    return (
      <View style={[
        styles.messageContainer,
        isMerchant ? styles.merchantMessage : styles.customerMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isMerchant ? styles.merchantBubble : styles.customerBubble
        ]}>
          <Text style={[
            styles.messageText,
            isMerchant ? styles.merchantText : styles.customerText
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.messageTime,
            isMerchant ? styles.merchantTime : styles.customerTime
          ]}>
            {new Date(item.created_at).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Text>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement de la conversation...</Text>
      </View>
    )
  }

  if (!conversation) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Conversation non trouvée</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>
              {conversation.customer?.email || 'Client'}
            </Text>
            {conversation.basket && (
              <Text style={styles.headerSubtitle}>
                {conversation.basket.title}
              </Text>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Messages */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Tapez votre message..."
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
        />
        <TouchableOpacity 
          style={styles.sendButton}
          onPress={handleSendMessage}
          disabled={sending || !newMessage.trim()}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color={sending || !newMessage.trim() ? theme.colors.textMuted : theme.colors.primary} 
          />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textMuted,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  backText: {
    fontSize: 16,
    color: theme.colors.primary,
  },
  header: {
    paddingTop: 60,
    paddingBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: theme.spacing.md,
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.white,
    opacity: 0.8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: theme.spacing.md,
  },
  messageContainer: {
    marginBottom: theme.spacing.md,
  },
  merchantMessage: {
    alignItems: 'flex-end',
  },
  customerMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: width * 0.75,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
  },
  merchantBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: theme.radius.sm,
  },
  customerBubble: {
    backgroundColor: theme.colors.white,
    borderBottomLeftRadius: theme.radius.sm,
    ...theme.shadow.card,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  merchantText: {
    color: theme.colors.white,
  },
  customerText: {
    color: theme.colors.text,
  },
  messageTime: {
    fontSize: 12,
    marginTop: theme.spacing.xs,
  },
  merchantTime: {
    color: theme.colors.white,
    opacity: 0.7,
  },
  customerTime: {
    color: theme.colors.textMuted,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
})