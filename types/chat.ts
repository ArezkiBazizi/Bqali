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
  last_message?: Message
  unread_count?: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_type: 'customer' | 'merchant'
  content: string
  message_type: 'text' | 'image' | 'file'
  file_url?: string
  file_name?: string
  file_size?: number
  is_read: boolean
  created_at: string
  sender?: {
    id: string
    email: string
    full_name?: string
  }
}

export interface ChatFilters {
  status?: 'active' | 'closed' | 'archived'
  unread_only?: boolean
} 