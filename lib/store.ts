import { User } from '@supabase/supabase-js'
import { create } from 'zustand'
import { Basket } from './api'

interface CartItem {
  basket: Basket
  quantity: number
}

interface AppState {
  user: User | null
  userRole: 'customer' | 'merchant' | 'admin' | null
  setUser: (user: User | null) => void
  setUserRole: (role: 'customer' | 'merchant' | 'admin' | null) => void
  currentLocation: {
    latitude: number
    longitude: number
  } | null
  setCurrentLocation: (location: { latitude: number; longitude: number } | null) => void

  cart: CartItem[]
  addToCart: (basket: Basket, quantity?: number) => void
  removeFromCart: (basketId: string) => void
  clearCart: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  userRole: null,
  setUser: (user) => set({ user }),
  setUserRole: (role) => set({ userRole: role }),
  currentLocation: null,
  setCurrentLocation: (location) => set({ currentLocation: location }),

  cart: [],
  addToCart: (basket, quantity = 1) => {
    const existing = get().cart
    const idx = existing.findIndex((c) => c.basket.id === basket.id)
    if (idx >= 0) {
      const updated = [...existing]
      updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + quantity }
      set({ cart: updated })
    } else {
      set({ cart: [...existing, { basket, quantity }] })
    }
  },
  removeFromCart: (basketId) => {
    set({ cart: get().cart.filter((c) => c.basket.id !== basketId) })
  },
  clearCart: () => set({ cart: [] }),
})) 