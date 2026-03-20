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

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    loadConversation()
  }, [id])

  const loadConversation = async () => {
    try {
      console.log('=== CHARGEMENT CONVERSATION ===')
      console.log('Conversation ID:', id)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('Utilisateur non connecté')
        return
      }

      console.log('User ID:', user.id)

      // Charger la conversation
      const conversations = await getConversations(user.id, 'customer')
      console.log('Toutes les conversations:', conversations)
      
      const conv = conversations.find(c => c.id === id)
      console.log('Conversation trouvée:', conv)
      
      if (!conv) {
        console.log('Conversation non trouvée dans la liste')
        setConversation(null)
        setLoading(false)
        return
      }

      setConversation(conv)

      // Charger les messages
      const messagesData = await getMessages(id!)
      console.log('Messages chargés:', messagesData)
      setMessages(messagesData)

      // Marquer les messages comme lus
      await markMessagesAsRead(id!, user.id, 'customer')
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation) return

    try {
      setSending(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const message = await sendMessage(
        conversation.id,
        user.id,
        'customer',
        newMessage.trim()
      )

      setMessages(prev => [...prev, message])
      setNewMessage('')
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderMessage = ({ item }: { item: any }) => {
    const isCustomer = item.sender_type === 'customer'
    
    return (
      <View style={[
        styles.messageContainer,
        isCustomer ? styles.customerMessage : styles.merchantMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isCustomer ? styles.customerBubble : styles.merchantBubble
        ]}>
          <Text style={[
            styles.messageText,
            isCustomer ? styles.customerText : styles.merchantText
          ]}>
            {item.content}
          </Text>
          <Text style={[
            styles.messageTime,
            isCustomer ? styles.customerTime : styles.merchantTime
          ]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    )
  }

  if (!conversation) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Conversation non trouvée</Text>
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
            <Text style={styles.headerTitle}>{conversation.merchant?.name}</Text>
            <Text style={styles.headerSubtitle}>{conversation.merchant?.address}</Text>
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
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          onPress={handleSendMessage}
          disabled={sending || !newMessage.trim()}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color={sending ? theme.colors.textMuted : theme.colors.white} 
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
    fontSize: 16,
    color: theme.colors.danger,
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
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  messageContainer: {
    marginBottom: theme.spacing.md,
  },
  customerMessage: {
    alignItems: 'flex-end',
  },
  merchantMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: width * 0.75,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
  },
  customerBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: theme.radius.sm,
  },
  merchantBubble: {
    backgroundColor: theme.colors.white,
    borderBottomLeftRadius: theme.radius.sm,
    ...theme.shadow.card,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  customerText: {
    color: theme.colors.white,
  },
  merchantText: {
    color: theme.colors.text,
  },
  messageTime: {
    fontSize: 12,
    marginTop: theme.spacing.xs,
  },
  customerTime: {
    color: theme.colors.white,
    opacity: 0.7,
  },
  merchantTime: {
    color: theme.colors.textMuted,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: theme.spacing.lg,
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
    marginRight: theme.spacing.md,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.textMuted,
  },
}) 
 
 