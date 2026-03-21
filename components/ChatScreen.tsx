import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useRef, useState } from 'react'
import {
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native'
import { theme } from '../constants/theme'
import { chatApi, Conversation, Message } from '../lib/chat'

interface ChatScreenProps {
  conversationId: string
  userId: string
  userType: 'customer' | 'merchant'
}

export default function ChatScreen({ conversationId, userId, userType }: ChatScreenProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const flatListRef = useRef<FlatList>(null)

  useEffect(() => {
    loadConversation()
    loadMessages()
  }, [])

  const loadConversation = async () => {
    try {
      // Charger les détails de la conversation
      // Cette fonction devrait être ajoutée à chatApi
    } catch (error) {
      console.error('Erreur lors du chargement de la conversation:', error)
    }
  }

  const loadMessages = async () => {
    try {
      setLoading(true)
      const data = await chatApi.getConversationMessages(conversationId)
      setMessages(data)
      
      // Marquer les messages comme lus
      await chatApi.markMessagesAsRead(conversationId, userId)
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)
      const message = await chatApi.sendMessage(
        conversationId,
        userId,
        userType,
        newMessage.trim()
      )
      
      setMessages(prev => [...prev, message])
      setNewMessage('')
      
      // Scroll vers le bas
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true })
      }, 100)
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
      Alert.alert('Erreur', 'Impossible d\'envoyer le message')
    } finally {
      setSending(false)
    }
  }

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0]
        // Ici, vous devriez uploader l'image vers Supabase Storage
        // Pour l'instant, on envoie juste l'URL locale
        await chatApi.sendMessage(
          conversationId,
          userId,
          userType,
          'Image envoyée',
          'image',
          asset.uri,
          asset.fileName || 'image.jpg',
          asset.fileSize
        )
      }
    } catch (error) {
      console.error('Erreur lors de la sélection d\'image:', error)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === userId
    const isImage = item.message_type === 'image'

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        {!isOwnMessage && (
          <View style={styles.messageAvatar}>
            <Ionicons name="person-outline" size={16} color={theme.colors.primary} />
          </View>
        )}
        
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownBubble : styles.otherBubble
        ]}>
          {isImage && item.file_url ? (
            <Image source={{ uri: item.file_url }} style={styles.messageImage} />
          ) : (
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText
            ]}>
              {item.content}
            </Text>
          )}
          
          <Text style={[
            styles.messageTime,
            isOwnMessage ? styles.ownMessageTime : styles.otherMessageTime
          ]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
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
        <Text style={styles.headerTitle}>
          {userType === 'customer' ? conversation?.merchant?.name : conversation?.customer?.email}
        </Text>
        {conversation?.basket && (
          <Text style={styles.headerSubtitle}>{conversation.basket.title}</Text>
        )}
      </LinearGradient>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
          <Ionicons name="camera-outline" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
        
        <TextInput
          style={styles.textInput}
          placeholder="Tapez votre message..."
          placeholderTextColor={theme.colors.textMuted}
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
          maxLength={500}
        />
        
        <TouchableOpacity 
          style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
          onPress={sendMessage}
          disabled={!newMessage.trim() || sending}
        >
          <Ionicons 
            name="send" 
            size={20} 
            color={newMessage.trim() ? theme.colors.white : theme.colors.textMuted} 
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
  header: {
    paddingTop: 60,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.white,
    opacity: 0.9,
    marginTop: theme.spacing.xs,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: theme.spacing.lg,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    alignItems: 'flex-end',
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
  },
  ownBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: theme.radius.sm,
  },
  otherBubble: {
    backgroundColor: theme.colors.white,
    borderBottomLeftRadius: theme.radius.sm,
    ...theme.shadow.card,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownMessageText: {
    color: theme.colors.white,
  },
  otherMessageText: {
    color: theme.colors.text,
  },
  messageTime: {
    fontSize: 12,
    marginTop: theme.spacing.xs,
  },
  ownMessageTime: {
    color: theme.colors.white,
    opacity: 0.8,
  },
  otherMessageTime: {
    color: theme.colors.textMuted,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  attachButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.sm,
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
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    marginLeft: theme.spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
}) 