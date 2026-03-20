import { Ionicons } from '@expo/vector-icons'
import React, { useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { theme } from '../constants/theme'

interface Filter {
  id: string
  label: string
  icon: string
}

interface FiltersProps {
  onFilterChange: (filters: string[]) => void
}

const AVAILABLE_FILTERS: Filter[] = [
  { id: 'bakery', label: 'Boulangerie', icon: 'bread-outline' },
  { id: 'grocery', label: 'Épicerie', icon: 'storefront-outline' },
  { id: 'restaurant', label: 'Restaurant', icon: 'restaurant-outline' },
  { id: 'cafe', label: 'Café', icon: 'cafe-outline' },
  { id: 'vegetables', label: 'Fruits & Légumes', icon: 'leaf-outline' },
  { id: 'meat', label: 'Boucherie', icon: 'fish-outline' },
]

export default function Filters({ onFilterChange }: FiltersProps) {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])

  const toggleFilter = (filterId: string) => {
    const newFilters = selectedFilters.includes(filterId)
      ? selectedFilters.filter(id => id !== filterId)
      : [...selectedFilters, filterId]
    
    setSelectedFilters(newFilters)
    onFilterChange(newFilters)
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Filtrer par catégorie</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {AVAILABLE_FILTERS.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterChip,
              selectedFilters.includes(filter.id) && styles.filterChipActive
            ]}
            onPress={() => toggleFilter(filter.id)}
          >
            <Ionicons 
              name={filter.icon as any} 
              size={20} 
              color={selectedFilters.includes(filter.id) ? theme.colors.white : theme.colors.primary} 
            />
            <Text style={[
              styles.filterText,
              selectedFilters.includes(filter.id) && styles.filterTextActive
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginRight: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.white,
    gap: theme.spacing.xs,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  filterTextActive: {
    color: theme.colors.white,
  },
}) 