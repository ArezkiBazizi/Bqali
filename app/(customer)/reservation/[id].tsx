import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useLocalSearchParams, useRouter } from 'expo-router'
import QRCode from 'qrcode'
import { useEffect, useState } from 'react'
import {
    Alert,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Image
} from 'react-native'
import { toast } from '../../../components/ui/Toast'
import { theme } from '../../../constants/theme'
import { api, Reservation } from '../../../lib/api'

const { width } = Dimensions.get('window')

interface ReservationWithDetails extends Reservation {
  baskets: {
    title: string
    description: string
    photo_url: string
    sale_price: number
    pickup_start: string
    pickup_end: string
    merchants: {
      name: string
      address: string
      city: string
    }
  }
}

export default function ReservationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [reservation, setReservation] = useState<ReservationWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)

  useEffect(() => {
    loadReservation()
  }, [id])

  // Génère le QR code uniquement quand la réservation est en état "pending" (email vérifié).
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!reservation || reservation.status !== 'pending') {
        setQrCodeDataUrl(null)
        return
      }

      try {
        const payload = (reservation as any).pickup_qr
        const url = await (QRCode as any).toDataURL(String(payload))
        if (!cancelled) setQrCodeDataUrl(url)
      } catch {
        if (!cancelled) setQrCodeDataUrl(null)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [reservation])

  const loadReservation = async () => {
    try {
      const data = await api.getReservationById(id!)
      setReservation(data)
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
      toast('Erreur lors du chargement de la réservation')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
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
      case 'pending_email_verification': return theme.colors.accent
      case 'picked': return theme.colors.success
      case 'cancelled': return theme.colors.danger
      case 'no_show': return theme.colors.textMuted
      default: return theme.colors.textMuted
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En attente de récupération'
      case 'pending_email_verification': return 'En attente de vérification email'
      case 'picked': return 'Récupéré ✅'
      case 'cancelled': return 'Annulé'
      case 'no_show': return 'Non récupéré'
      default: return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time-outline'
      case 'pending_email_verification': return 'mail-outline'
      case 'picked': return 'checkmark-circle-outline'
      case 'cancelled': return 'close-circle-outline'
      case 'no_show': return 'alert-circle-outline'
      default: return 'help-circle-outline'
    }
  }

  const cancelReservation = async () => {
    if (!reservation) return

    Alert.alert(
      'Annuler la réservation',
      'Êtes-vous sûr de vouloir annuler cette réservation ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.updateReservationStatus(reservation.id, 'cancelled')
              toast('Réservation annulée')
              router.back()
            } catch (error) {
              console.error('Erreur lors de l\'annulation:', error)
              toast('Erreur lors de l\'annulation')
            }
          }
        }
      ]
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <Ionicons name="receipt-outline" size={32} color={theme.colors.primary} />
          <Text style={styles.loadingText}>Chargement de votre réservation...</Text>
        </View>
      </View>
    )
  }

  if (!reservation) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={theme.colors.danger} />
        <Text style={styles.errorTitle}>Réservation non trouvée</Text>
        <Text style={styles.errorSubtitle}>
          {`Cette réservation n'existe pas ou a été supprimée`}
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header avec gradient */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <Ionicons name="checkmark-circle-outline" size={24} color={theme.colors.white} />
            <Text style={styles.headerTitle}>Réservation confirmée</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Votre panier est réservé avec succès
          </Text>
        </View>
      </LinearGradient>

      {/* Statut de la réservation */}
      <View style={styles.statusSection}>
        <View style={[styles.statusCard, { borderLeftColor: getStatusColor(reservation.status) }]}>
          <View style={styles.statusHeader}>
            <Ionicons 
              name={getStatusIcon(reservation.status)} 
              size={24} 
              color={getStatusColor(reservation.status)} 
            />
            <Text style={styles.statusTitle}>{getStatusText(reservation.status)}</Text>
          </View>
          <Text style={styles.statusSubtitle}>
            {reservation.status === 'pending' 
              ? 'Présentez ce QR code au commerçant lors du retrait'
              : reservation.status === 'pending_email_verification'
              ? 'Vérifiez votre email pour accéder au QR code'
              : reservation.status === 'picked'
              ? 'Votre panier a été récupéré avec succès'
              : 'Cette réservation a été annulée ou n\'a pas été récupérée'
            }
          </Text>
        </View>
      </View>

      {/* QR Code et informations */}
      {reservation.status === 'pending' && (
        <View style={styles.qrSection}>
          <View style={styles.qrCard}>
            <Text style={styles.qrTitle}>Code de récupération</Text>
            <View style={styles.qrContainer}>
              {qrCodeDataUrl ? (
                <Image
                  source={{ uri: qrCodeDataUrl }}
                  style={styles.qrImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.qrPlaceholder}>
                  <Ionicons name="qr-code-outline" size={64} color={theme.colors.textMuted} />
                  <Text style={styles.qrPlaceholderText}>Génération du QR code...</Text>
                </View>
              )}
            </View>
            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>Code :</Text>
              <Text style={styles.codeValue}>{reservation.pickup_code}</Text>
            </View>
            <Text style={styles.qrInstructions}>
              Montrez ce QR code ou donnez le code au commerçant
            </Text>
          </View>
        </View>
      )}

      {/* Détails de la réservation */}
      <View style={styles.detailsSection}>
        <Text style={styles.sectionTitle}>Détails de la réservation</Text>
        
        <View style={styles.detailCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Panier :</Text>
            <Text style={styles.detailValue}>{reservation.baskets.title}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Commerçant :</Text>
            <Text style={styles.detailValue}>{reservation.baskets.merchants.name}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Adresse :</Text>
            <Text style={styles.detailValue}>
              {reservation.baskets.merchants.address}, {reservation.baskets.merchants.city}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Réservé le :</Text>
            <Text style={styles.detailValue}>{formatDate(reservation.created_at)}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Créneau de retrait :</Text>
            <Text style={styles.detailValue}>
              {formatPickupTime(reservation.baskets.pickup_start)} - {formatPickupTime(reservation.baskets.pickup_end)}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantité :</Text>
            <Text style={styles.detailValue}>{reservation.reserved_qty}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Montant à payer :</Text>
            <Text style={[styles.detailValue, styles.amountValue]}>
              {reservation.amount_due} DA
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Méthode de paiement :</Text>
            <Text style={styles.detailValue}>
              {reservation.pay_method === 'cash' ? 'Espèces sur place' : reservation.pay_method}
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsSection}>
        {(reservation.status === 'pending' || reservation.status === 'pending_email_verification') && (
          <TouchableOpacity style={styles.cancelBtn} onPress={cancelReservation}>
            <Ionicons name="close-outline" size={20} color={theme.colors.danger} />
            <Text style={styles.cancelBtnText}>Annuler la réservation</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => router.push('/(customer)/reservations')}
        >
          <Ionicons name="list-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.backBtnText}>Voir toutes mes réservations</Text>
        </TouchableOpacity>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  errorSubtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
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
  statusSection: {
    padding: theme.spacing.lg,
  },
  statusCard: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderLeftWidth: 4,
    ...theme.shadow.card,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  statusSubtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 20,
  },
  qrSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  qrCard: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  qrContainer: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadow.card,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryMuted,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.md,
  },
  codeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
  },
  codeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    fontFamily: 'monospace',
  },
  qrInstructions: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  detailsSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  detailCard: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    ...theme.shadow.card,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  detailLabel: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: '600',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  amountValue: {
    color: theme.colors.success,
    fontWeight: 'bold',
  },
  actionsSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.danger,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    gap: theme.spacing.sm,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  bottomSpacing: {
    height: 100,
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
  },
  qrPlaceholderText: {
    marginTop: theme.spacing.sm,
    fontSize: 12,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
}) 