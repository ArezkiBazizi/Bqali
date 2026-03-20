import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { toast } from '../../components/ui/Toast'
import { theme } from '../../constants/theme'
import { Favorite, getFavorites, removeFromFavorites } from '../../lib/favorites'

export default function Favorites() {
  const router = useRouter()
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadFavorites = async () => {
    try {
      const data = await getFavorites()
      setFavorites(data)
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error)
      toast('Erreur lors du chargement des favoris')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadFavorites()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    loadFavorites()
  }

  const handleRemoveFavorite = async (basketId: string) => {
    try {
      await removeFromFavorites(basketId)
      setFavorites(favorites.filter(fav => fav.basket_id !== basketId))
      toast('Retiré des favoris 💔')
    } catch (error) {
      console.error('Erreur lors de la suppression des favoris:', error)
      toast('Erreur lors de la suppression')
    }
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

  const renderFavorite = (favorite: Favorite) => (
    <TouchableOpacity
      key={favorite.id}
      style={styles.favoriteCard}
      onPress={() => router.push(`/(customer)/basket/${favorite.basket_id}`)}
    >
      <View style={styles.favoriteHeader}>
        <View style={styles.favoriteInfo}>
          <Text style={styles.favoriteTitle} numberOfLines={1}>
            {favorite.basket?.title || 'Panier Surprise'}
          </Text>
          <Text style={styles.favoriteMerchant} numberOfLines={1}>
            {favorite.basket?.merchants?.name || 'Établissement'}
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => handleRemoveFavorite(favorite.basket_id)}
        >
          <Ionicons name="heart" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>

      <View style={styles.favoriteDetails}>
        <View style={styles.pickupInfo}>
          <Ionicons name="time-outline" size={14} color="#666666" />
          <Text style={styles.pickupText}>
            À récupérer {formatDate(favorite.basket?.pickup_start || '')} {formatPickupTime(favorite.basket?.pickup_start || '')} - {formatPickupTime(favorite.basket?.pickup_end || '')}
          </Text>
        </View>

        <View style={styles.priceContainer}>
          <View style={styles.priceInfo}>
            <Text style={styles.originalPrice}>{favorite.basket?.original_price} DA</Text>
            <Text style={styles.salePrice}>{favorite.basket?.sale_price} DA</Text>
          </View>
          
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>
              -{Math.round(((favorite.basket?.original_price || 0) - (favorite.basket?.sale_price || 0)) / (favorite.basket?.original_price || 1) * 100)}%
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header avec gradient */}
      <LinearGradient
        colors={['#2E7D32', '#1B5E20']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <Ionicons name="heart-outline" size={24} color="#FFFFFF" />
            <Text style={styles.headerTitle}>Mes favoris</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {favorites.length} panier{favorites.length > 1 ? 's' : ''} favori{favorites.length > 1 ? 's' : ''}
          </Text>
        </View>
      </LinearGradient>

      {/* Liste des favoris */}
      <View style={styles.favoritesSection}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="heart-outline" size={32} color={theme.colors.textMuted} />
            <Text style={styles.loadingText}>Chargement de vos favoris...</Text>
          </View>
        ) : favorites.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="heart-outline" size={64} color={theme.colors.textMuted} />
            <Text style={styles.emptyTitle}>Aucun favori</Text>
            <Text style={styles.emptySubtitle}>
              Les paniers que vous aimez apparaîtront ici
            </Text>
            <TouchableOpacity 
              style={styles.exploreBtn}
              onPress={() => router.push('/(public)')}
            >
              <Ionicons name="compass-outline" size={20} color="#FFFFFF" />
              <Text style={styles.exploreBtnText}>Découvrir les paniers</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.favoritesList}>
            {favorites.map(renderFavorite)}
          </View>
        )}
      </View>

      {/* Espacement pour le footer */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
    color: '#FFFFFF',
    marginLeft: theme.spacing.sm,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
  },
  favoritesSection: {
    padding: theme.spacing.lg,
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    padding: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 14,
    color: theme.colors.textMuted,
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
    marginBottom: theme.spacing.xl,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    gap: theme.spacing.sm,
  },
  exploreBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  favoritesList: {
    gap: theme.spacing.md,
  },
  favoriteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  favoriteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  favoriteMerchant: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  removeBtn: {
    padding: theme.spacing.sm,
  },
  favoriteDetails: {
    gap: theme.spacing.sm,
  },
  pickupInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pickupText: {
    fontSize: 13,
    color: '#666666',
    flex: 1,
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
  bottomSpacing: {
    height: 100,
  },
}) 