import { router } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { theme } from '../../constants/theme'
import { supabase } from '../../lib/supabase'
import { Basket } from '../../types/basket'

export default function MerchantBaskets() {
  const [baskets, setBaskets] = useState<Basket[]>([])
  const [loading, setLoading] = useState(true)

  const loadBaskets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Récupérer les paniers du marchand
      const { data: merchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (!merchant) return

      const { data: basketsData } = await supabase
        .from('baskets')
        .select('*')
        .eq('merchant_id', merchant.id)
        .order('created_at', { ascending: false })

      setBaskets(basketsData || [])
    } catch (error) {
      console.error('Erreur lors du chargement des paniers:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBaskets()
  }, [])

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut()
            router.replace('/(auth)/login')
          }
        }
      ]
    )
  }

  const createNewBasket = () => {
    router.push('/(merchant)/basket/new')
  }

  const editBasket = (basketId: string) => {
    router.push(`/(merchant)/basket/edit/${basketId}`)
  }

  const deleteBasket = async (basketId: string, basketTitle: string) => {
    Alert.alert(
      'Supprimer le panier',
      `Êtes-vous sûr de vouloir supprimer "${basketTitle}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('baskets')
                .delete()
                .eq('id', basketId)
              
              if (error) throw error
              
              // Recharger la liste
              await loadBaskets()
              Alert.alert('Succès', 'Panier supprimé avec succès')
            } catch (error) {
              console.error('Erreur lors de la suppression:', error)
              Alert.alert('Erreur', 'Impossible de supprimer le panier')
            }
          }
        }
      ]
    )
  }

  const toggleBasketStatus = async (basketId: string, currentStatus: string, basketTitle: string) => {
    const newStatus = currentStatus === 'active' ? 'expired' : 'active'
    const action = newStatus === 'active' ? 'activer' : 'désactiver'
    
    console.log('=== DÉBUT CHANGEMENT STATUT ===')
    console.log('ID du panier:', basketId)
    console.log('Statut actuel:', currentStatus)
    console.log('Nouveau statut:', newStatus)
    console.log('Action:', action)
    
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} le panier`,
      `Êtes-vous sûr de vouloir ${action} "${basketTitle}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: async () => {
            try {
              console.log('Mise à jour du statut en cours...')
              
              const { error } = await supabase
                .from('baskets')
                .update({ status: newStatus })
                .eq('id', basketId)
              
              if (error) {
                console.log('Erreur lors de la mise à jour:', error)
                throw error
              }
              
              console.log('Statut mis à jour avec succès')
              
              // Recharger la liste
              await loadBaskets()
              Alert.alert('Succès', `Panier ${action}é avec succès`)
            } catch (error) {
              console.error('Erreur lors de la modification:', error)
              const msg = error instanceof Error ? error.message : String(error)
              Alert.alert('Erreur', `Impossible de ${action} le panier: ${msg}`)
            }
          }
        }
      ]
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return theme.colors.success
      case 'soldout': return theme.colors.danger
      case 'expired': return theme.colors.textMuted
      default: return theme.colors.textMuted
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Actif'
      case 'soldout': return 'Épuisé'
      case 'expired': return 'Expiré'
      default: return status
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Chargement...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Mes Paniers</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Déconnexion</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadBaskets} />
        }
      >
        <TouchableOpacity style={styles.createBtn} onPress={createNewBasket}>
          <Text style={styles.createBtnText}>+ Créer un nouveau panier</Text>
        </TouchableOpacity>

        {baskets.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucun panier créé</Text>
            <Text style={styles.emptySubtext}>Créez votre premier panier pour commencer à vendre</Text>
          </View>
        ) : (
          baskets.map((basket) => (
            <View key={basket.id} style={styles.basketCard}>
              {basket.photo_url && (
                <Image source={{ uri: basket.photo_url }} style={styles.basketImage} />
              )}
              
              <View style={styles.basketContent}>
                <View style={styles.basketHeader}>
                  <Text style={styles.basketTitle}>{basket.title}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(basket.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(basket.status)}</Text>
                  </View>
                </View>
                
                <Text style={styles.basketDescription}>{basket.description}</Text>
                
                <View style={styles.basketInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Prix original:</Text>
                    <Text style={styles.infoValue}>{basket.original_price} DA</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Prix de vente:</Text>
                    <Text style={styles.priceValue}>{basket.sale_price} DA</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Stock disponible:</Text>
                    <Text style={styles.infoValue}>{basket.qty_available}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Récupération:</Text>
                    <Text style={styles.infoValue}>
                      {new Date(basket.pickup_start).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })} - {new Date(basket.pickup_end).toLocaleTimeString('fr-FR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.editBtn} 
                    onPress={() => editBasket(basket.id)}
                  >
                    <Text style={styles.editBtnText}>Modifier</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.toggleBtn, { 
                      backgroundColor: basket.status === 'active' ? theme.colors.danger : theme.colors.success 
                    }]} 
                    onPress={() => toggleBasketStatus(basket.id, basket.status, basket.title)}
                  >
                    <Text style={styles.toggleBtnText}>
                      {basket.status === 'active' ? 'Désactiver' : 'Activer'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.deleteBtn} 
                    onPress={() => deleteBasket(basket.id, basket.title)}
                  >
                    <Text style={styles.deleteBtnText}>Supprimer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
  },
  backBtn: {
    color: theme.colors.white,
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  logoutBtn: {
    backgroundColor: theme.colors.danger,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
  },
  logoutBtnText: {
    color: theme.colors.white,
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  createBtn: {
    backgroundColor: theme.colors.success,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  createBtnText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  basketCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
    elevation: 2,
    overflow: 'hidden',
  },
  basketImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  basketContent: {
    padding: theme.spacing.lg,
  },
  basketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  basketTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.sm,
  },
  statusText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  basketDescription: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
    lineHeight: 20,
  },
  basketInfo: {
    marginBottom: theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  infoValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  editBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    flex: 1,
    alignItems: 'center',
  },
  editBtnText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  toggleBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    flex: 1,
    alignItems: 'center',
  },
  toggleBtnText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  deleteBtn: {
    backgroundColor: theme.colors.danger,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    flex: 1,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  loading: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
    color: theme.colors.textMuted,
  },
}) 