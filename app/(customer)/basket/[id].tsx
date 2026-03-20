import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Button from '../../../components/ui/Button'
import { toast } from '../../../components/ui/Toast'
import { theme } from '../../../constants/theme'
import { api, Basket, Reservation } from '../../../lib/api'
import { createConversation } from '../../../lib/chat'
import { sendExpoPushAsync } from '../../../lib/notifications'
import { useAppStore } from '../../../lib/store'
import { supabase } from '../../../lib/supabase'
import { calculateDiscount, calculateDistance, formatPickupTime, formatPrice } from '../../../lib/utils'

export default function BasketDetail() {
  const { id, preset } = useLocalSearchParams<{ id: string; preset?: string }>()
  const router = useRouter()
  const [basket, setBasket] = useState<Basket | null>(null)
  const [loading, setLoading] = useState(true)
  const currentLocation = useAppStore((s) => s.currentLocation)
  const addToCart = useAppStore((s) => s.addToCart)
  const [reserving, setReserving] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        if (preset) {
          const decoded = JSON.parse(decodeURIComponent(preset)) as Basket
          setBasket(decoded)
          setLoading(false)
          return
        }
        const data = await api.getBasketById(id!)
        setBasket(data)
      } catch (e: any) {
        toast('Erreur de chargement')
      } finally {
        setLoading(false)
      }
    })()
  }, [id, preset])

  const reserve = async () => {
    try {
      if (!basket) return

      setReserving(true)
      const res = await api.reserveBasketWithEmail(basket, 1, 'cash')

      toast('Réservation créée. Vérifie ton email ✅')
      router.push({ pathname: '/(customer)/verify-reservation', params: { reservationId: res.id } })
    } catch (e: any) {
      toast(e?.message || 'Erreur lors de la réservation')
    } finally {
      setReserving(false)
    }
  }

  const addItem = () => {
    if (!basket) return
    addToCart(basket, 1)
    toast('Ajouté au panier 🧺')
  }

  const handleContactMerchant = async () => {
    if (!basket) return

    try {
      console.log('=== CONTACT MARCHAND ===')
      console.log('Basket:', basket.id)
      console.log('Merchant ID:', basket.merchant_id)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast('Vous devez être connecté pour contacter le commerçant')
        return
      }

      console.log('User ID:', user.id)

      // Créer ou récupérer la conversation
      const conversation = await createConversation(user.id, basket.merchant_id, basket.id)
      console.log('Conversation créée/récupérée:', conversation.id)
      
      toast('Redirection vers le chat...')
      router.push(`/(customer)/chat/${conversation.id}`)
    } catch (error) {
      console.error('Erreur lors de la création de la conversation:', error)
      toast('Erreur lors de la création de la conversation')
    }
  }

  if (loading || !basket) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={theme.colors.teal} />
      </View>
    )
  }

  const discount = calculateDiscount(basket.original_price, basket.sale_price)
  const distance = currentLocation && basket.merchants
    ? calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        basket.merchants.lat,
        basket.merchants.lng
      )
    : null

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Image source={{ uri: basket.photo_url }} style={styles.cover} />

      <View style={styles.header}>
        <Text style={styles.title}>{basket.title}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>-{discount}%</Text>
        </View>
      </View>

      <Text style={styles.merchant}>{basket.merchants?.name}</Text>
      {!!basket.merchants?.address && (
        <Text style={styles.address}>{basket.merchants.address}{basket.merchants.city ? `, ${basket.merchants.city}` : ''}</Text>
      )}

      <View style={styles.infoRow}>
        <Text style={styles.infoPill}>À retirer {formatPickupTime(basket.pickup_start, basket.pickup_end)}</Text>
        {distance && (
          <Text style={styles.infoPill}>{distance.toFixed(1)} km</Text>
        )}
      </View>

      <Text style={styles.description}>{basket.description}</Text>

      <View style={styles.priceRow}>
        <Text style={styles.originalPrice}>{formatPrice(basket.original_price)}</Text>
        <Text style={styles.salePrice}>{formatPrice(basket.sale_price)}</Text>
      </View>

      {/* Actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity 
          style={styles.chatBtn} 
          onPress={handleContactMerchant}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryDark, theme.colors.accent]}
            style={styles.chatBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.chatBtnPattern}>
              <View style={styles.patternDot1} />
              <View style={styles.patternDot2} />
              <View style={styles.patternDot3} />
            </View>
            
            <View style={styles.chatBtnContent}>
              <View style={styles.chatBtnIconContainer}>
                <View style={styles.chatBtnIcon}>
                  <Ionicons name="chatbubbles" size={28} color={theme.colors.white} />
                </View>
                <View style={styles.chatBtnIconGlow} />
              </View>
              
              <View style={styles.chatBtnTextContainer}>
                <Text style={styles.chatBtnTitle}>💬 Contacter le commerçant</Text>
                <Text style={styles.chatBtnSubtitle}>Posez vos questions en direct</Text>
                <View style={styles.chatBtnBadge}>
                  <Ionicons name="flash" size={12} color={theme.colors.white} />
                  <Text style={styles.chatBtnBadgeText}>Réponse rapide</Text>
                </View>
              </View>
              
              <View style={styles.chatBtnArrow}>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.white} />
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <Button
          title="Ajouter au panier"
          onPress={addItem}
          variant="secondary"
          style={{ marginBottom: theme.spacing.sm }}
        />
        
        <Button
          title={reserving ? 'Réservation...' : 'Réserver ce panier'}
          onPress={() => {
            if (reserving || basket.qty_available <= 0) return
            reserve()
          }}
        />
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  cover: {
    width: '100%',
    height: 220,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  badge: {
    backgroundColor: theme.colors.teal,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
  },
  badgeText: {
    color: theme.colors.white,
    fontWeight: '700',
  },
  merchant: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 4,
  },
  address: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  infoPill: {
    backgroundColor: theme.colors.primaryMuted,
    color: theme.colors.tealDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
    fontWeight: '700',
  },
  description: {
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  originalPrice: {
    color: theme.colors.textMuted,
    textDecorationLine: 'line-through',
    fontSize: 16,
  },
  salePrice: {
    color: theme.colors.teal,
    fontWeight: '800',
    fontSize: 22,
  },
  actionsSection: {
    gap: theme.spacing.lg,
    marginBottom: 100,
  },
  chatBtn: {
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
    ...theme.shadow.card,
    elevation: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  chatBtnGradient: {
    padding: theme.spacing.xl,
    position: 'relative',
  },
  chatBtnPattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 100,
    height: 100,
    opacity: 0.1,
  },
  patternDot1: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.white,
  },
  patternDot2: {
    position: 'absolute',
    top: 40,
    right: 40,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.white,
  },
  patternDot3: {
    position: 'absolute',
    top: 60,
    right: 60,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.white,
  },
  chatBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    zIndex: 1,
  },
  chatBtnIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBtnIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: theme.spacing.lg,
    borderRadius: theme.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  chatBtnIconGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: theme.radius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  chatBtnTextContainer: {
    flex: 1,
  },
  chatBtnTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  chatBtnSubtitle: {
    fontSize: 16,
    color: theme.colors.white,
    opacity: 0.95,
    fontWeight: '500',
    marginBottom: theme.spacing.sm,
  },
  chatBtnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
    alignSelf: 'flex-start',
    gap: theme.spacing.xs,
  },
  chatBtnBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  chatBtnArrow: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: theme.spacing.md,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
}) 