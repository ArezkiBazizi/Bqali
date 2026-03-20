import { useRouter } from 'expo-router'
import React, { useMemo, useState } from 'react'
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Button from '../../components/ui/Button'
import { toast } from '../../components/ui/Toast'
import { theme } from '../../constants/theme'
import { api } from '../../lib/api'
import { useAppStore } from '../../lib/store'
import { formatPrice } from '../../lib/utils'

export default function CartScreen() {
  const router = useRouter()
  const cart = useAppStore((s) => s.cart)
  const removeFromCart = useAppStore((s) => s.removeFromCart)
  const clearCart = useAppStore((s) => s.clearCart)
  const [reserving, setReserving] = useState(false)

  const total = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.basket.sale_price * item.quantity, 0)
  }, [cart])

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mon panier</Text>

      <FlatList
        data={cart}
        keyExtractor={(item) => item.basket.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Votre panier est vide</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Image source={{ uri: item.basket.photo_url }} style={styles.image} />
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>{item.basket.title}</Text>
              <Text style={styles.merchant} numberOfLines={1}>{item.basket.merchants?.name}</Text>
              <Text style={styles.price}>{formatPrice(item.basket.sale_price)} × {item.quantity}</Text>
            </View>
            <TouchableOpacity onPress={() => removeFromCart(item.basket.id)}>
              <Text style={styles.remove}>Retirer</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {cart.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
          </View>
          <View style={{ gap: 10 }}>
            <Button
              title={reserving ? 'Réservation...' : 'Réserver le panier (email)'}
              onPress={async () => {
                if (reserving) return
                try {
                  setReserving(true)
                  if (cart.length === 0) return

                  for (const item of cart) {
                    await api.reserveBasketWithEmail(item.basket, item.quantity, 'cash')
                  }

                  clearCart()
                  toast('Réservations créées. Vérifie ton email ✅')
                  router.replace('/(customer)/reservations')
                } catch (e: any) {
                  toast(e?.message || 'Erreur lors de la réservation du panier')
                } finally {
                  setReserving(false)
                }
              }}
            />
            <Button title="Vider le panier" variant="secondary" onPress={clearCart} />
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  empty: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: 10,
    marginBottom: 12,
    ...theme.shadow.card,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 12,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontWeight: '800',
    color: theme.colors.text,
  },
  merchant: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  price: {
    color: theme.colors.tealDark,
    fontWeight: '700',
  },
  remove: {
    color: theme.colors.danger,
    fontWeight: '700',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
    gap: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  totalValue: {
    color: theme.colors.text,
    fontWeight: '900',
    fontSize: 18,
  },
}) 