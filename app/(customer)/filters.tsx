import { LinearGradient } from 'expo-linear-gradient'
import React, { useState } from 'react'
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'
import { theme } from '../../constants/theme'
import { SearchFilters } from '../../lib/search'

interface FiltersScreenProps {
  onApplyFilters: (filters: SearchFilters) => void
  initialFilters?: SearchFilters
}

export default function FiltersScreen({ onApplyFilters, initialFilters }: FiltersScreenProps) {
  const [filters, setFilters] = useState<SearchFilters>(initialFilters || {})

  const updateFilter = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyFilters = () => {
    onApplyFilters(filters)
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.primaryDark]}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Filtres</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Distance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distance maximale</Text>
          <View style={styles.distanceOptions}>
            {[1, 3, 5, 10, 20].map(distance => (
              <TouchableOpacity
                key={distance}
                style={[
                  styles.distanceOption,
                  filters.maxDistance === distance && styles.distanceOptionActive
                ]}
                onPress={() => updateFilter('maxDistance', distance)}
              >
                <Text style={[
                  styles.distanceText,
                  filters.maxDistance === distance && styles.distanceTextActive
                ]}>
                  {distance} km
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Prix maximum */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prix maximum (DA)</Text>
          <View style={styles.priceOptions}>
            {[500, 1000, 1500, 2000, 3000].map(price => (
              <TouchableOpacity
                key={price}
                style={[
                  styles.priceOption,
                  filters.maxPrice === price && styles.priceOptionActive
                ]}
                onPress={() => updateFilter('maxPrice', price)}
              >
                <Text style={[
                  styles.priceText,
                  filters.maxPrice === price && styles.priceTextActive
                ]}>
                  {price} DA
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Réduction minimum */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Réduction minimum</Text>
          <View style={styles.discountOptions}>
            {[30, 40, 50, 60, 70].map(discount => (
              <TouchableOpacity
                key={discount}
                style={[
                  styles.discountOption,
                  filters.minDiscount === discount && styles.discountOptionActive
                ]}
                onPress={() => updateFilter('minDiscount', discount)}
              >
                <Text style={[
                  styles.discountText,
                  filters.minDiscount === discount && styles.discountTextActive
                ]}>
                  {discount}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Options</Text>
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Paniers disponibles uniquement</Text>
            <Switch
              value={filters.availableOnly || false}
              onValueChange={(value) => updateFilter('availableOnly', value)}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.white}
            />
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.resetButton} onPress={() => setFilters({})}>
          <Text style={styles.resetButtonText}>Réinitialiser</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
          <Text style={styles.applyButtonText}>Appliquer</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  distanceOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  distanceOption: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.white,
  },
  distanceOptionActive: {
    backgroundColor: theme.colors.primary,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  distanceTextActive: {
    color: theme.colors.white,
  },
  priceOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  priceOption: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.white,
  },
  priceOptionActive: {
    backgroundColor: theme.colors.primary,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  priceTextActive: {
    color: theme.colors.white,
  },
  discountOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  discountOption: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.white,
  },
  discountOptionActive: {
    backgroundColor: theme.colors.primary,
  },
  discountText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  discountTextActive: {
    color: theme.colors.white,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    ...theme.shadow.card,
  },
  optionLabel: {
    fontSize: 16,
    color: theme.colors.text,
  },
  footer: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  resetButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  applyButton: {
    flex: 1,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.white,
  },
}) 