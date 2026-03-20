import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  FlatList,
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert
} from 'react-native'
import * as Location from 'expo-location'
import BasketCard from '../../components/BasketCard'
import MapViewComponent from '../../components/MapView'
import FooterBar from '../../components/ui/FooterBar'
import { theme } from '../../constants/theme'
import { api, Basket } from '../../lib/api'

const { width, height } = Dimensions.get('window')

export default function PublicHome() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [baskets, setBaskets] = useState<Basket[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedLocation, setSelectedLocation] = useState('Quartier Saint-Vincent-de-Paul, Paris')
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null)
  const [locationPermission, setLocationPermission] = useState(false)
  const [region, setRegion] = useState({
    latitude: 36.7525,
    longitude: 3.04197,
    latitudeDelta: 0.09,
    longitudeDelta: 0.04,
  })
  const scrollY = useRef(new Animated.Value(0)).current

  const categories = [
    { id: 'all', label: 'Tous', icon: 'grid-outline' },
    { id: 'meal', label: 'Repas', icon: 'restaurant-outline' },
    { id: 'bakery', label: 'Boulangerie & pâtisserie', icon: 'cafe-outline' },
    { id: 'grocery', label: 'Épicerie', icon: 'storefront-outline' },
    { id: 'flowers', label: 'Fleurs', icon: 'flower-outline' },
    { id: 'other', label: 'Autres', icon: 'ellipsis-horizontal-outline' }
  ]

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert(
          'Permission de localisation',
          'La localisation est nécessaire pour vous montrer les paniers près de chez vous.',
          [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Paramètres', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        )
        return false
      }
      setLocationPermission(true)
      return true
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error)
      return false
    }
  }

  const getCurrentLocation = async () => {
    try {
      const hasPermission = await requestLocationPermission()
      if (!hasPermission) return

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })
      
      setUserLocation(location)
      
      // Mettre à jour la région de la carte
      setRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      })

      // Obtenir l'adresse à partir des coordonnées
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      })

      if (address && address.length > 0) {
        const addr = address[0]
        const locationName = `${addr.district || addr.subregion || addr.region || 'Alger'}, ${addr.city || 'Alger'}`
        setSelectedLocation(locationName)
      }

      console.log('Localisation obtenue:', location.coords)
    } catch (error) {
      console.error('Erreur lors de la récupération de la localisation:', error)
      Alert.alert('Erreur', 'Impossible d\'obtenir votre localisation')
    }
  }

  const loadBaskets = async () => {
    try {
      setLoading(true)
      const data = await api.getActiveBaskets()
      setBaskets(data || [])
      
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
    getCurrentLocation()
  }, [])

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

  const filtered = useMemo(() => {
    let filteredBaskets = baskets

    // Filtrage par catégorie
    if (selectedCategory !== 'all') {
      filteredBaskets = filteredBaskets.filter((basket) => {
        const title = basket.title?.toLowerCase() || ''
        const description = basket.description?.toLowerCase() || ''
        
        switch (selectedCategory) {
          case 'meal':
            return title.includes('repas') || title.includes('plat') || title.includes('menu')
          case 'bakery':
            return title.includes('pain') || title.includes('viennoiserie') || title.includes('pâtisserie') || title.includes('boulangerie')
          case 'grocery':
            return title.includes('épicerie') || title.includes('fruits') || title.includes('légumes')
          case 'flowers':
            return title.includes('fleur') || title.includes('bouquet')
          default:
            return true
        }
      })
    }

    // Filtrage par recherche
    const q = query.trim().toLowerCase()
    if (q) {
      filteredBaskets = filteredBaskets.filter((b) => {
        const inTitle = b.title?.toLowerCase().includes(q)
        const inMerchant = b.merchants?.name?.toLowerCase().includes(q)
        const inCity = b.merchants?.city?.toLowerCase().includes(q)
        return inTitle || inMerchant || inCity
      })
    }

    // Filtrage par proximité si la localisation est disponible
    if (userLocation && filteredBaskets.length > 0) {
      filteredBaskets = filteredBaskets.map(basket => {
        if (basket.merchants?.lat && basket.merchants?.lng) {
          const distance = calculateDistance(
            userLocation.coords.latitude,
            userLocation.coords.longitude,
            basket.merchants.lat,
            basket.merchants.lng
          )
          return { ...basket, distance }
        }
        return { ...basket, distance: 999999 }
      }).sort((a, b) => (a.distance || 0) - (b.distance || 0))
    }

    return filteredBaskets
  }, [query, baskets, selectedCategory, userLocation])

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

  const renderBasketCard = ({ item }: { item: Basket }) => (
    <BasketCard basket={item} userLocation={userLocation} />
  )

  const renderCategoryButton = (category: any) => (
    <TouchableOpacity
      key={category.id}
      style={[
        styles.categoryButton,
        selectedCategory === category.id && styles.categoryButtonActive
      ]}
      onPress={() => setSelectedCategory(category.id)}
    >
      <Text style={[
        styles.categoryButtonText,
        selectedCategory === category.id && styles.categoryButtonTextActive
      ]}>
        {category.label}
      </Text>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container} {...panResponder.panHandlers}>
      <StatusBar barStyle="light-content" backgroundColor="#2E7D32" />
      
      {/* Header avec gradient Too Good To Go style */}
      <LinearGradient
        colors={['#2E7D32', '#1B5E20']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Barre de navigation moderne */}
        <View style={styles.navBar}>
          <View style={styles.brandContainer}>
            <Ionicons name="leaf" size={28} color="#FFFFFF" />
            <Text style={styles.brand}>BQALI</Text>
          </View>
          <TouchableOpacity 
            style={styles.accountBtn}
            onPress={() => router.push('/(auth)/login')}
          >
            <Ionicons name="person-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Section de bienvenue */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Découvrez les meilleurs paniers</Text>
          <Text style={styles.welcomeSubtitle}>Fraîcheur garantie, prix réduits</Text>
        </View>

        {/* Barre de localisation */}
        <View style={styles.locationContainer}>
          <TouchableOpacity 
            style={styles.locationBar}
            onPress={getCurrentLocation}
          >
            <Ionicons name="location-outline" size={16} color="#FFFFFF" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationLabel}>Emplacement choisi</Text>
              <Text style={styles.locationName} numberOfLines={1}>
                {selectedLocation}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={16} color="#FFFFFF" />
          </TouchableOpacity>
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

        {/* Barre de catégories */}
        <View style={styles.categoriesContainer}>
          <FlatList
            data={categories}
            renderItem={({ item }) => renderCategoryButton(item)}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
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
              color={viewMode === 'list' ? '#2E7D32' : '#FFFFFF'} 
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
              color={viewMode === 'map' ? '#2E7D32' : '#FFFFFF'} 
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
              colors={['#2E7D32']}
              tintColor={'#2E7D32'}
            />
          }
          renderItem={renderBasketCard}
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
              setRegion(newRegion)
            }}
            onMarkerPress={(basket) => {
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
    backgroundColor: '#F5F5F5',
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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  locationContainer: {
    marginBottom: theme.spacing.lg,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    gap: theme.spacing.sm,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  locationName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    fontSize: 12,
    flex: 1,
  },
  categoriesContainer: {
    marginBottom: theme.spacing.lg,
  },
  categoriesList: {
    gap: theme.spacing.sm,
  },
  categoryButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  categoryButtonActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  categoryButtonTextActive: {
    color: '#2E7D32',
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
    backgroundColor: '#FFFFFF',
  },
  viewBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
  },
  viewBtnTextActive: {
    color: '#2E7D32',
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
    backgroundColor: '#E8F5E8',
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mapInfoText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
})
