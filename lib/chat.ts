import { supabase } from './supabase'

export interface Conversation {
  id: string
  customer_id: string
  merchant_id: string
  basket_id?: string
  status: 'active' | 'closed' | 'archived'
  created_at: string
  updated_at: string
  customer?: {
    id: string
    email: string
    full_name?: string
  }
  merchant?: {
    id: string
    name: string
    address?: string
  }
  basket?: {
    id: string
    title: string
    photo_url?: string
  }
  last_message?: {
    id: string
    content: string
    sender_type: 'customer' | 'merchant'
    created_at: string
  }
  unread_count?: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: 'customer' | 'merchant'
  content: string
  message_type: 'text' | 'image' | 'file'
  metadata?: any
  created_at: string
  read_at?: string
  sender?: {
    id: string
    email: string
    full_name?: string
  }
}

export const createConversation = async (
  customerId: string, 
  merchantId: string, 
  basketId?: string
): Promise<Conversation> => {
  try {
    console.log('=== CRÉATION CONVERSATION ===')
    console.log('Customer ID:', customerId)
    console.log('Merchant ID:', merchantId)
    console.log('Basket ID:', basketId)

    // Vérifier si une conversation existe déjà
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('customer_id', customerId)
      .eq('merchant_id', merchantId)
      .eq('basket_id', basketId)
      .single()

    if (existingConversation) {
      console.log('Conversation existante trouvée:', existingConversation.id)
      return existingConversation as Conversation
    }

    // Créer une nouvelle conversation
    const { data: newConversation, error } = await supabase
      .from('conversations')
      .insert({
        customer_id: customerId,
        merchant_id: merchantId,
        basket_id: basketId
      })
      .select(`
        *,
        customer:customer_id(id, email, full_name),
        merchant:merchant_id(id, name, address),
        basket:basket_id(id, title, photo_url)
      `)
      .single()

    if (error) {
      console.error('Erreur lors de la création de la conversation:', error)
      throw error
    }

    console.log('Nouvelle conversation créée:', newConversation.id)
    return newConversation as Conversation
  } catch (error) {
    console.error('Erreur dans createConversation:', error)
    throw error
  }
}

export const getConversations = async (
  userId: string, 
  userType: 'customer' | 'merchant'
): Promise<Conversation[]> => {
  try {
    console.log('=== RÉCUPÉRATION CONVERSATIONS ===')
    console.log('User ID:', userId)
    console.log('User Type:', userType)

    let query = supabase
      .from('conversations')
      .select(`
        *,
        customer:customer_id(id, email, full_name),
        merchant:merchant_id(id, name, address),
        basket:basket_id(id, title, photo_url),
        last_message:messages(
          id,
          content,
          sender_type,
          created_at
        ),
        unread_count:messages(
          id
        )
      `)
      .order('updated_at', { ascending: false })

    if (userType === 'customer') {
      query = query.eq('customer_id', userId)
    } else {
      // Pour les marchands, récupérer via l'ID du marchand
      const { data: merchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('owner_id', userId)
        .single()

      if (!merchant) {
        console.log('Aucun marchand trouvé pour cet utilisateur')
        return []
      }

      query = query.eq('merchant_id', merchant.id)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erreur lors de la récupération des conversations:', error)
      throw error
    }

    console.log('Conversations récupérées:', data?.length || 0)
    return (data || []) as Conversation[]
  } catch (error) {
    console.error('Erreur dans getConversations:', error)
    throw error
  }
}

export const getMessages = async (conversationId: string): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id(id, email, full_name)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data || []) as Message[]
  } catch (error) {
    console.error('Erreur dans getMessages:', error)
    throw error
  }
}

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  senderType: 'customer' | 'merchant',
  content: string
): Promise<Message> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        sender_type: senderType,
        content
      })
      .select(`
        *,
        sender:sender_id(id, email, full_name)
      `)
      .single()

    if (error) throw error

    // Mettre à jour la conversation
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    return data as Message
  } catch (error) {
    console.error('Erreur dans sendMessage:', error)
    throw error
  }
}

export const markMessagesAsRead = async (conversationId: string, userId: string) => {
  try {
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .is('read_at', null)
  } catch (error) {
    console.error('Erreur dans markMessagesAsRead:', error)
    throw error
  }
} 