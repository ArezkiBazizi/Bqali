import { Basket } from './api'
import { calculateDistance } from './geolocation'

export interface SearchFilters {
  categories?: string[]
  maxDistance?: number // en km
  maxPrice?: number
  minDiscount?: number // pourcentage
  availableOnly?: boolean
}

export const filterBaskets = (
  baskets: Basket[],
  filters: SearchFilters,
  userLocation?: { latitude: number; longitude: number }
): Basket[] => {
  return baskets.filter(basket => {
    // Filtre par catégorie
    if (filters.categories && filters.categories.length > 0) {
      const basketCategory = basket.category || 'other'
      if (!filters.categories.includes(basketCategory)) {
        return false
      }
    }

    // Filtre par distance
    if (filters.maxDistance && userLocation && basket.merchants?.lat && basket.merchants?.lng) {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        basket.merchants.lat,
        basket.merchants.lng
      )
      if (distance > filters.maxDistance) {
        return false
      }
    }

    // Filtre par prix maximum
    if (filters.maxPrice && basket.sale_price > filters.maxPrice) {
      return false
    }

    // Filtre par réduction minimum
    if (filters.minDiscount && basket.original_price && basket.sale_price) {
      const discount = ((basket.original_price - basket.sale_price) / basket.original_price) * 100
      if (discount < filters.minDiscount) {
        return false
      }
    }

    // Filtre par disponibilité
    if (filters.availableOnly && basket.qty_available <= 0) {
      return false
    }

    return true
  })
} 