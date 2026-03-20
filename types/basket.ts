export interface Basket {
  id: string
  title: string
  description: string
  original_price: number
  sale_price: number
  qty_available: number
  pickup_start: string
  pickup_end: string
  photo_url?: string
  status: 'active' | 'expired' | 'sold_out'
  merchant_id: string
  created_at: string
  updated_at: string
  merchants?: {
    id: string
    name: string
    address: string
    city: string
    lat?: number
    lng?: number
  }
} 