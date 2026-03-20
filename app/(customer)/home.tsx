import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native'
import BasketCard from '../../components/BasketCard'
import MapViewComponent from '../../components/MapView'
import FooterBar from '../../components/ui/FooterBar'
import { theme } from '../../constants/theme'
import { api, Basket } from '../../lib/api'

const { width, height } = Dimensions.get('window')

export default function Home() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [baskets, setBaskets] = useState<Basket[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [region, setRegion] = useState({
    latitude: 36.7525,
    longitude: 3.04197,
    latitudeDelta: 0.09,
    longitudeDelta: 0.04,
  })
  const scrollY = useRef(new Animated.Value(0)).current

  const loadBaskets = async () => {
    try {
      setLoading(true)
      const data = await api.getActiveBaskets()
      
      // Debug: afficher les données récupérées
      console.log('Données récupérées:', data)
      if (data && data.length > 0) {
        console.log('Premier panier:', data[0])
        console.log('Marchand du premier panier:', data[0].merchants)
      }
      
      setBaskets(data || [])
      
      // Mettre à jour la région de la carte avec le premier panier
      if (data && data.length > 0) {
        const first = data[0]
        if (first?.merchants?.lat && first?.merchants?.lng) {
          setRegion((r) => ({ 
            ...r, 
            latitude: first.merchants!.lat, 
            longitude: first.merchants!.lng 
          }))
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paniers:', error)
      setBaskets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBaskets()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return baskets
    return baskets.filter((b) => {
      const inTitle = b.title?.toLowerCase().includes(q)
      const inMerchant = b.merchants?.name?.toLowerCase().includes(q)
      const inCity = b.merchants?.city?.toLowerCase().includes(q)
      return inTitle || inMerchant || inCity
    })
  }, [query, baskets])

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_: GestureResponderEvent, gesture: PanResponderGestureState) => {
        return Math.abs(gesture.dx) > 12 && Math.abs(gesture.dy) < 10
      },
      onPanResponderRelease: (_: GestureResponderEvent, gesture: PanResponderGestureState) => {
        if (gesture.dx <= -50 && viewMode === 'list') {
          setViewMode('map')
        } else if (gesture.dx >= 50 && viewMode === 'map') {
          setViewMode('list')
        }
      },
    })
  ).current

  // Logs quand on change de mode
  useEffect(() => {
    console.log('=== MODE CHANGÉ ===')
    console.log('Nouveau mode:', viewMode)
    console.log('Paniers disponibles:', baskets?.length || 0)
    console.log('Région actuelle:', region)
  }, [viewMode, baskets, region])

  // Logs pour le rendu de la carte
  useEffect(() => {
    if (viewMode === 'map') {
      console.log('=== RENDU CARTE ===')
      console.log('Paniers pour la carte:', filtered?.length || 0)
      console.log('Région pour la carte:', region)
    }
  }, [viewMode, filtered, region])

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
      
      {/* Header avec gradient agronomique */}
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Barre de navigation moderne */}
        <View style={styles.navBar}>
          <View style={styles.brandContainer}>
            <Ionicons name="leaf" size={28} color={theme.colors.white} />
            <Text style={styles.brand}>BQALI</Text>
          </View>
        </View>

        {/* Section de bienvenue */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Découvrez les meilleurs paniers</Text>
          <Text style={styles.welcomeSubtitle}>Fraîcheur garantie, prix réduits</Text>
        </View>

        {/* Barre de recherche moderne */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="rgba(255,255,255,0.7)" />
            <TextInput
              placeholder="Rechercher un panier, établissement, ville"
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={query}
              onChangeText={setQuery}
              style={styles.searchInput}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Sélecteur de vue avec design moderne */}
        <View style={styles.viewSelector}>
          <TouchableOpacity
            style={[styles.viewBtn, viewMode === 'list' && styles.viewBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons 
              name="list-outline" 
              size={20} 
              color={viewMode === 'list' ? theme.colors.primary : theme.colors.white} 
            />
            <Text style={[styles.viewBtnText, viewMode === 'list' && styles.viewBtnTextActive]}>
              Liste
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.viewBtn, viewMode === 'map' && styles.viewBtnActive]}
            onPress={() => setViewMode('map')}
          >
            <Ionicons 
              name="map-outline" 
              size={20} 
              color={viewMode === 'map' ? theme.colors.primary : theme.colors.white} 
            />
            <Text style={[styles.viewBtnText, viewMode === 'map' && styles.viewBtnTextActive]}>
              Carte
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Contenu principal */}
      {viewMode === 'list' ? (
        <Animated.FlatList
          contentContainerStyle={styles.listContent}
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl 
              refreshing={loading} 
              onRefresh={loadBaskets}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
          renderItem={({ item }) => <BasketCard basket={item} />}
          ListEmptyComponent={!loading ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="basket-outline" size={48} color={theme.colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>
                {baskets.length === 0 
                  ? "Aucun panier disponible" 
                  : "Aucun panier trouvé"
                }
              </Text>
              <Text style={styles.emptySubtitle}>
                {baskets.length === 0 
                  ? "Revenez plus tard pour découvrir de nouveaux paniers" 
                  : "Essayez de modifier votre recherche"
                }
              </Text>
            </View>
          ) : null}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />
      ) : (
        <View style={styles.mapWrapper}>
          <MapViewComponent
            baskets={filtered}
            region={region}
            onRegionChangeComplete={(newRegion) => {
              console.log('Nouvelle région reçue:', newRegion)
              setRegion(newRegion)
            }}
            onMarkerPress={(basket) => {
              console.log('Navigation vers panier:', basket.id)
              router.push(`/(customer)/basket/${basket.id}`)
            }}
          />
          <View style={styles.mapOverlay}>
            <View style={styles.mapInfo}>
              <Ionicons name="location-outline" size={16} color={theme.colors.textMuted} />
              <Text style={styles.mapInfoText}>Glissez pour naviguer sur la carte</Text>
            </View>
          </View>
        </View>
      )}

      <FooterBar />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 10,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brand: {
    color: theme.colors.white,
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 1,
    marginLeft: theme.spacing.sm,
  },
  accountBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: theme.spacing.sm,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeSection: {
    marginBottom: theme.spacing.lg,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: theme.colors.white,
    opacity: 0.9,
  },
  searchContainer: {
    marginBottom: theme.spacing.lg,
  },
  searchBar: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  searchInput: {
    color: theme.colors.white,
    fontSize: 13,
    flex: 1,
  },
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: theme.radius.lg,
    padding: 1,
    marginBottom: theme.spacing.lg,
    gap: 4,
  },
  viewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    gap: theme.spacing.xs,
  },
  viewBtnActive: {
    backgroundColor: theme.colors.white,
  },
  viewBtnText: {
    color: theme.colors.white,
    fontWeight: '600',
    fontSize: 13,
  },
  viewBtnTextActive: {
    color: theme.colors.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.white,
    opacity: 0.8,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: theme.spacing.md,
  },
  listContent: {
    paddingTop: theme.spacing.md,
    paddingBottom: 110,
  },
  emptyState: {
    padding: theme.spacing.xl,
    alignItems: 'center',
  },
  emptyIcon: {
    backgroundColor: theme.colors.primaryMuted,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  mapWrapper: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    minHeight: 400,
  },
  mapOverlay: {
    position: 'absolute',
    top: theme.spacing.lg,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    zIndex: 1,
  },
  mapInfo: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    ...theme.shadow.card,
  },
  mapInfoText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
}) 