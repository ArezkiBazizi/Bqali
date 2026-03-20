import React, { useEffect, useState } from 'react'
import { StyleSheet, View, Text, Dimensions, TouchableOpacity, ScrollView, Linking } from 'react-native'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import { theme } from '../constants/theme'
import { Basket } from '../lib/api'

const { width, height } = Dimensions.get('window')

interface MapViewComponentProps {
  baskets: Basket[]
  region: any
  onRegionChangeComplete: (region: any) => void
  onMarkerPress: (basket: Basket) => void
}

export default function MapViewComponent({
  baskets,
  region,
  onRegionChangeComplete,
  onMarkerPress
}: MapViewComponentProps) {
  
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null)
  const [userLocation, setUserLocation] = useState<any>(null)

  useEffect(() => {
    checkLocationPermission()
  }, [])

  const checkLocationPermission = async () => {
    try {
      console.log('🔍 Vérification des permissions de localisation...')
      
      const { status } = await Location.requestForegroundPermissionsAsync()
      console.log('📱 Statut permission:', status)
      
      setLocationPermission(status === 'granted')
      
      if (status === 'granted') {
        console.log('📍 Récupération de la position...')
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
        
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        })
        
        console.log('✅ Position récupérée:', userLocation)
      } else {
        console.log('❌ Permission refusée')
      }
    } catch (error) {
      console.log('❌ Erreur permission:', error)
      setLocationPermission(false)
    }
  }

  const openGoogleMaps = () => {
    const center = `${region.latitude},${region.longitude}`
    const url = `https://www.google.com/maps/@${center},13z`
    Linking.openURL(url)
  }

  const openBasketLocation = (basket: Basket) => {
    if (basket.merchants?.lat && basket.merchants?.lng) {
      const url = `https://www.google.com/maps/@${basket.merchants.lat},${basket.merchants.lng},15z`
      Linking.openURL(url)
    }
  }

  const handleMarkerPress = (basket: Basket) => {
    console.log(' Panier sélectionné:', basket.title)
    onMarkerPress(basket)
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="map-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.headerTitle}>Carte des Paniers</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          {baskets.length} panier{baskets.length > 1 ? 's' : ''} disponible{baskets.length > 1 ? 's' : ''}
        </Text>
      </View>

      {/* Zone de carte temporaire */}
      <View style={styles.mapPlaceholder}>
        <View style={styles.mapContent}>
          <Ionicons name="map-outline" size={64} color={theme.colors.primary} />
          <Text style={styles.mapTitle}>Carte Google Maps</Text>
          <Text style={styles.mapSubtitle}>
            Cliquez pour ouvrir la carte dans votre navigateur
          </Text>
          
          <TouchableOpacity style={styles.openMapBtn} onPress={openGoogleMaps}>
            <Ionicons name="open-outline" size={20} color={theme.colors.white} />
            <Text style={styles.openMapBtnText}>Ouvrir Google Maps</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Liste des paniers avec localisation */}
      <View style={styles.basketsList}>
        <Text style={styles.listTitle}>Paniers disponibles</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {baskets.map((basket) => (
            <TouchableOpacity
              key={basket.id}
              style={styles.basketCard}
              onPress={() => handleMarkerPress(basket)}
            >
              <Text style={styles.basketTitle}>{basket.title}</Text>
              <Text style={styles.basketMerchant}>{basket.merchants?.name}</Text>
              <Text style={styles.basketPrice}>{basket.sale_price} DA</Text>
              
              {basket.merchants?.lat && basket.merchants?.lng && (
                <TouchableOpacity 
                  style={styles.locationBtn}
                  onPress={() => openBasketLocation(basket)}
                >
                  <Ionicons name="location-outline" size={16} color={theme.colors.primary} />
                  <Text style={styles.locationBtnText}>Voir sur la carte</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Informations de localisation */}
      {userLocation && (
        <View style={styles.locationInfo}>
          <Ionicons name="location" size={16} color={theme.colors.success} />
          <Text style={styles.locationText}>
            Position détectée: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
  },
  mapPlaceholder: {
    flex: 1,
    margin: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.white,
    ...theme.shadow.card,
  },
  mapContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  mapTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  mapSubtitle: {
    fontSize: 16,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  openMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.lg,
    gap: theme.spacing.sm,
  },
  openMapBtnText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  basketsList: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  basketCard: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    marginRight: theme.spacing.md,
    width: 180,
    ...theme.shadow.card,
  },
  basketTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  basketMerchant: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.xs,
  },
  basketPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.success,
    marginBottom: theme.spacing.sm,
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryMuted,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.md,
    gap: theme.spacing.xs,
  },
  locationBtnText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    margin: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    gap: theme.spacing.sm,
    ...theme.shadow.card,
  },
  locationText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    flex: 1,
  },
}) 