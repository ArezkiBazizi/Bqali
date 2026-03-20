import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useEffect, useState } from 'react'
import {
    Alert,
    Dimensions,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native'
import { toast } from '../../components/ui/Toast'
import { theme } from '../../constants/theme'
import { api, Reservation } from '../../lib/api'
import { supabase } from '../../lib/supabase'

const { width } = Dimensions.get('window')

interface ReservationWithDetails extends Reservation {
  baskets: {
    title: string
    description: string
    photo_url: string
    sale_price: number
    pickup_start: string
    pickup_end: string
  }
  users: {
    email: string
    phone?: string
  }
}

interface ReservationStats {
  total: number
  pending: number
  picked: number
  cancelled: number
  noShow: number
  totalRevenue: number
}

export default function MerchantReservations() {
  const router = useRouter()
  const [reservations, setReservations] = useState<ReservationWithDetails[]>([])
  const [stats, setStats] = useState<ReservationStats>({
    total: 0,
    pending: 0,
    picked: 0,
    cancelled: 0,
    noShow: 0,
    totalRevenue: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'picked' | 'cancelled'>('all')

  const loadReservations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Récupérer l'ID du marchand
      const { data: merchant } = await supabase
        .from('merchants')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (!merchant) {
        toast('Marchand non trouvé')
        return
      }

      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          baskets!inner(
            title,
            description,
            photo_url,
            sale_price,
            pickup_start,
            pickup_end
          ),
          users!inner(email, phone)
        `)
        .eq('baskets.merchant_id', merchant.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const reservationsData = data || []
      setReservations(reservationsData)

      // Calculer les statistiques
      const newStats: ReservationStats = {
        total: reservationsData.length,
        pending: reservationsData.filter(r => r.status === 'pending').length,
        picked: reservationsData.filter(r => r.status === 'picked').length,
        cancelled: reservationsData.filter(r => r.status === 'cancelled').length,
        noShow: reservationsData.filter(r => r.status === 'no_show').length,
        totalRevenue: reservationsData
          .filter(r => r.status === 'picked')
          .reduce((sum, r) => sum + r.amount_due, 0)
      }
      setStats(newStats)
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error)
      toast('Erreur lors du chargement')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadReservations()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    loadReservations()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPickupTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return theme.colors.accent
      case 'picked': return theme.colors.success
      case 'cancelled': return theme.colors.danger
      case 'no_show': return theme.colors.textMuted
      default: return theme.colors.textMuted
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente'
      case 'picked': return 'Récupéré'
      case 'cancelled': return 'Annulé'
      case 'no_show': return 'Non récupéré'
      default: return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time-outline'
      case 'picked': return 'checkmark-circle-outline'
      case 'cancelled': return 'close-circle-outline'
      case 'no_show': return 'alert-circle-outline'
      default: return 'help-circle-outline'
    }
  }

  const isExpired = (expiresAt: string) => {
    return new Date() > new Date(expiresAt)
  }

  const confirmPickup = async (reservation: ReservationWithDetails) => {
    Alert.alert(
      'Confirmer le retrait',
      `Confirmer la récupération du panier "${reservation.baskets.title}" par ${reservation.users.email} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'default',
          onPress: async () => {
            try {
              await api.updateReservationStatus(reservation.id, 'picked')
              toast('Retrait confirmé ✅')
              await loadReservations()
            } catch (error) {
              console.error('Erreur de confirmation:', error)
              toast('Erreur lors de la confirmation')
            }
          }
        }
      ]
    )
  }

  const markAsNoShow = async (reservation: ReservationWithDetails) => {
    Alert.alert(
      'Marquer comme non récupéré',
      `Marquer la réservation de ${reservation.users.email} comme non récupérée ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.updateReservationStatus(reservation.id, 'no_show')
              toast('Marqué comme non récupéré')
              await loadReservations()
            } catch (error) {
              console.error('Erreur:', error)
              toast('Erreur lors de la mise à jour')
            }
          }
        }
      ]
    )
  }

  const filteredReservations = reservations.filter(reservation => {
    if (filter === 'all') return true
    return reservation.status === filter
  })

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <Ionicons name="receipt-outline" size={32} color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement des réservations...</Text>
        </View>
      </View>
    )
  }

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
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <Ionicons name="receipt-outline" size={24} color={theme.colors.white} />
            <Text style={styles.headerTitle}>Mes réservations</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            {stats.total} réservation{stats.total > 1 ? 's' : ''} • {stats.totalRevenue} DA de revenus
          </Text>
        </View>
      </LinearGradient>

      {/* Statistiques */}
      <View style={styles.statsSection}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="time-outline" size={20} color={theme.colors.accent} />
            <Text style={styles.statNumber}>{stats.pending}</Text>
            <Text style={styles.statLabel}>En attente</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.success} />
            <Text style={styles.statNumber}>{stats.picked}</Text>
            <Text style={styles.statLabel}>Récupérées</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="close-circle-outline" size={20} color={theme.colors.danger} />
            <Text style={styles.statNumber}>{stats.cancelled}</Text>
            <Text style={styles.statLabel}>Annulées</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="cash-outline" size={20} color={theme.colors.accent} />
            <Text style={styles.statNumber}>{stats.totalRevenue}</Text>
            <Text style={styles.statLabel}>Revenus (DA)</Text>
          </View>
        </View>
      </View>

      {/* Filtres */}
      <View style={styles.filtersSection}>
        <Text style={styles.sectionTitle}>Filtrer par statut</Text>
        <View style={styles.filtersContainer}>
          {[
            { key: 'all', label: 'Toutes', icon: 'list-outline' },
            { key: 'pending', label: 'En attente', icon: 'time-outline' },
            { key: 'picked', label: 'Récupérées', icon: 'checkmark-circle-outline' },
            { key: 'cancelled', label: 'Annulées', icon: 'close-circle-outline' }
          ].map((filterOption) => (
            <TouchableOpacity
              key={filterOption.key}
              style={[
                styles.filterBtn,
                filter === filterOption.key && styles.filterBtnActive
              ]}
              onPress={() => setFilter(filterOption.key as any)}
            >
              <Ionicons 
                name={filterOption.icon as any} 
                size={16} 
                color={filter === filterOption.key ? theme.colors.primary : theme.colors.textMuted} 
              />
              <Text style={[
                styles.filterBtnText,
                filter === filterOption.key && styles.filterBtnTextActive
              ]}>
                {filterOption.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Liste des réservations */}
      <View style={styles.reservationsSection}>
        {filteredReservations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={theme.colors.textMuted} />
            <Text style={styles.emptyTitle}>
              {filter === 'all' ? 'Aucune réservation' : `Aucune réservation ${getStatusText(filter)}`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === 'all' 
                ? 'Les réservations de vos paniers apparaîtront ici'
                : `Aucune réservation avec le statut "${getStatusText(filter)}"`
              }
            </Text>
          </View>
        ) : (
          filteredReservations.map((reservation) => (
            <View key={reservation.id} style={styles.reservationCard}>
              <View style={styles.reservationHeader}>
                <View style={styles.reservationInfo}>
                  <Text style={styles.reservationTitle}>{reservation.baskets.title}</Text>
                  <Text style={styles.reservationClient}>{reservation.users.email}</Text>
                  {reservation.users.phone && (
                    <Text style={styles.reservationPhone}>{reservation.users.phone}</Text>
                  )}
                </View>
                
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(reservation.status) }]}>
                  <Ionicons 
                    name={getStatusIcon(reservation.status)} 
                    size={16} 
                    color={theme.colors.white} 
                  />
                  <Text style={styles.statusText}>{getStatusText(reservation.status)}</Text>
                </View>
              </View>

              <View style={styles.reservationDetails}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Réservé le:</Text>
                  <Text style={styles.detailValue}>{formatDate(reservation.created_at)}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Récupération:</Text>
                  <Text style={styles.detailValue}>
                    {formatPickupTime(reservation.baskets.pickup_start)} - {formatPickupTime(reservation.baskets.pickup_end)}
                  </Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Quantité:</Text>
                  <Text style={styles.detailValue}>{reservation.reserved_qty}</Text>
                </View>
                
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Montant:</Text>
                  <Text style={[styles.detailValue, styles.amountValue]}>
                    {reservation.amount_due} DA
                  </Text>
                </View>
                
                {reservation.status === 'pending' && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Code:</Text>
                    <Text style={[styles.detailValue, styles.codeValue]}>
                      {reservation.pickup_code}
                    </Text>
                  </View>
                )}
              </View>

              {/* Actions */}
              <View style={styles.actionsContainer}>
                {reservation.status === 'pending' && !isExpired(reservation.expires_at) && (
                  <>
                    <TouchableOpacity 
                      style={styles.actionBtn}
                      onPress={() => confirmPickup(reservation)}
                    >
                      <Ionicons name="checkmark-outline" size={16} color={theme.colors.success} />
                      <Text style={styles.actionBtnText}>Confirmer retrait</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.actionBtn, styles.noShowBtn]}
                      onPress={() => markAsNoShow(reservation)}
                    >
                      <Ionicons name="alert-outline" size={16} color={theme.colors.danger} />
                      <Text style={[styles.actionBtnText, styles.noShowBtnText]}>Non récupéré</Text>
                    </TouchableOpacity>
                  </>
                )}
                
                {isExpired(reservation.expires_at) && reservation.status === 'pending' && (
                  <View style={styles.expiredBadge}>
                    <Ionicons name="alert-circle-outline" size={16} color={theme.colors.danger} />
                    <Text style={styles.expiredText}>Expiré</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      {/* Actions rapides */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={styles.quickActionBtn}
            onPress={() => router.push('/(merchant)/validate-pickup')}
          >
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.primaryDark]}
              style={styles.quickActionGradient}
            >
              <Ionicons name="qr-code-outline" size={24} color={theme.colors.white} />
              <Text style={styles.quickActionText}>Valider retrait</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionBtn}
            onPress={() => router.push('/(merchant)/baskets')}
          >
            <LinearGradient
              colors={[theme.colors.teal, theme.colors.tealDark]}
              style={styles.quickActionGradient}
            >
              <Ionicons name="basket-outline" size={24} color={theme.colors.white} />
              <Text style={styles.quickActionText}>Gérer paniers</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Espacement pour le footer */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingCard: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: 16,
    color: theme.colors.textMuted,
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
    color: theme.colors.white,
    marginLeft: theme.spacing.sm,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  statsSection: {
    padding: theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  statCard: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    flex: 1,
    ...theme.shadow.card,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  filtersSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  filtersContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
    flex: 1,
  },
  filterBtnActive: {
    backgroundColor: theme.colors.primaryMuted,
    borderColor: theme.colors.primary,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  filterBtnTextActive: {
    color: theme.colors.primary,
  },
  reservationsSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
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
  },
  reservationCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  reservationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  reservationInfo: {
    flex: 1,
  },
  reservationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  reservationClient: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  reservationPhone: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
    gap: theme.spacing.xs,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  reservationDetails: {
    marginBottom: theme.spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xs,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  amountValue: {
    color: theme.colors.success,
    fontWeight: 'bold',
  },
  codeValue: {
    fontFamily: 'monospace',
    backgroundColor: theme.colors.primaryMuted,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.success,
    gap: theme.spacing.xs,
    flex: 1,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.success,
  },
  noShowBtn: {
    borderColor: theme.colors.danger,
  },
  noShowBtnText: {
    color: theme.colors.danger,
  },
  expiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.danger + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.pill,
    gap: theme.spacing.xs,
  },
  expiredText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.danger,
  },
  quickActionsSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  quickActionBtn: {
    flex: 1,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    ...theme.shadow.card,
  },
  quickActionGradient: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  quickActionText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: theme.spacing.sm,
  },
  bottomSpacing: {
    height: 100,
  },
})