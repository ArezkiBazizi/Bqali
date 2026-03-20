import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Basket } from '../lib/api'
import { isFavorite, toggleFavorite } from '../lib/favorites'
import { toast } from './ui/Toast'

const { width } = Dimensions.get('window')

interface BasketCardProps {
  basket: Basket
  userLocation?: Location.LocationObject | null
}

export default function BasketCard({ basket, userLocation }: BasketCardProps) {
  const router = useRouter()
  const [isFav, setIsFav] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkFavoriteStatus()
  }, [basket.id])

  const checkFavoriteStatus = async () => {
    try {
      const favorite = await isFavorite(basket.id)
      setIsFav(favorite)
    } catch (error) {
      console.error('Erreur lors de la vérification des favoris:', error)
    }
  }

  const handleFavoritePress = async () => {
    if (loading) return
    
    try {
      setLoading(true)
      const newFavoriteStatus = await toggleFavorite(basket.id)
      setIsFav(newFavoriteStatus)
      
      if (newFavoriteStatus) {
        toast('Ajouté aux favoris ❤️')
      } else {
        toast('Retiré des favoris 💔')
      }
    } catch (error) {
      console.error('Erreur lors du toggle des favoris:', error)
      toast('Erreur lors de la modification des favoris')
    } finally {
      setLoading(false)
    }
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3 // Rayon de la Terre en mètres
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c // Distance en mètres
  }

  const formatPickupTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Demain'
    } else {
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      })
    }
  }

  const calculateRating = () => {
    // Simulation de note - dans une vraie app, récupérer depuis la DB
    return (Math.random() * 2 + 3).toFixed(1)
  }

  const getDistance = () => {
    if (userLocation && basket.merchants?.lat && basket.merchants?.lng) {
      const distance = calculateDistance(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        basket.merchants.lat,
        basket.merchants.lng
      )
      return Math.round(distance)
    }
    return Math.floor(Math.random() * 1000) + 100 // Distance simulée si pas de localisation
  }

  const distance = getDistance()
  const rating = calculateRating()

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/(customer)/basket/${basket.id}`)}
    >
      {/* Image du panier */}
      <View style={styles.imageContainer}>
        <Image
          source={{ 
            uri: basket.photo_url || 'https://via.placeholder.com/300x200/2E7D32/FFFFFF?text=Panier+Surprise'
          }}
          style={styles.image}
          resizeMode="cover"
        />
        
        {/* Badge de note */}
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color="#FFD700" />
          <Text style={styles.ratingText}>{rating}</Text>
        </View>

        {/* Icône de favori */}
        <TouchableOpacity 
          style={styles.favoriteBtn}
          onPress={handleFavoritePress}
          disabled={loading}
        >
          <Ionicons 
            name={isFav ? "heart" : "heart-outline"} 
            size={20} 
            color={isFav ? "#FF6B6B" : "#FFFFFF"} 
          />
        </TouchableOpacity>
      </View>

      {/* Contenu de la carte */}
      <View style={styles.content}>
        {/* Nom de l'établissement */}
        <Text style={styles.merchantName} numberOfLines={1}>
          {basket.merchants?.name || 'Établissement'}
        </Text>

        {/* Type de panier */}
        <Text style={styles.basketType} numberOfLines={1}>
          {basket.title || 'Panier Surprise'}
        </Text>

        {/* Informations de récupération */}
        <View style={styles.pickupInfo}>
          <Ionicons name="time-outline" size={14} color="#666666" />
          <Text style={styles.pickupText}>
            À récupérer {formatDate(basket.pickup_start)} {formatPickupTime(basket.pickup_start)} - {formatPickupTime(basket.pickup_end)}
          </Text>
        </View>

        {/* Distance */}
        <View style={styles.distanceInfo}>
          <Ionicons name="location-outline" size={14} color="#666666" />
          <Text style={styles.distanceText}>
            {distance < 1000 ? `${distance} m` : `${(distance / 1000).toFixed(1)} km`}
          </Text>
        </View>

        {/* Prix */}
        <View style={styles.priceContainer}>
          <View style={styles.priceInfo}>
            <Text style={styles.originalPrice}>{basket.original_price} DA</Text>
            <Text style={styles.salePrice}>{basket.sale_price} DA</Text>
          </View>
          
          {/* Badge d'économie */}
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>
              -{Math.round(((basket.original_price - basket.sale_price) / basket.original_price) * 100)}%
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333333',
  },
  favoriteBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 8,
    borderRadius: 20,
  },
  content: {
    padding: 16,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  basketType: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  pickupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  pickupText: {
    fontSize: 13,
    color: '#666666',
    flex: 1,
  },
  distanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  distanceText: {
    fontSize: 13,
    color: '#666666',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  salePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  savingsBadge: {
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
}) 


