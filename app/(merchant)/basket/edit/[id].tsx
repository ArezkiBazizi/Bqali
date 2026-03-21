import { router, useLocalSearchParams } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { theme } from '../../../../constants/theme'
import { Basket } from '../../../../lib/api'
import { supabase } from '../../../../lib/supabase'

export default function EditBasket() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [basket, setBasket] = useState<Basket | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    original_price: '',
    sale_price: '',
    qty_available: '',
    pickup_start: '',
    pickup_end: '',
    photo_url: ''
  })
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const loadBasket = async () => {
    try {
      setInitialLoading(true)
      
      const { data: basketData, error } = await supabase
        .from('baskets')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      setBasket(basketData)
      setFormData({
        title: basketData.title || '',
        description: basketData.description || '',
        original_price: basketData.original_price?.toString() || '',
        sale_price: basketData.sale_price?.toString() || '',
        qty_available: basketData.qty_available?.toString() || '',
        pickup_start: basketData.pickup_start ? new Date(basketData.pickup_start).toISOString().slice(0, 16) : '',
        pickup_end: basketData.pickup_end ? new Date(basketData.pickup_end).toISOString().slice(0, 16) : '',
        photo_url: basketData.photo_url || ''
      })
    } catch (error) {
      console.error('Erreur lors du chargement du panier:', error)
      Alert.alert('Erreur', 'Impossible de charger le panier')
      router.back()
    } finally {
      setInitialLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      loadBasket()
    }
  }, [id])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateBasket = async () => {
    // Validation
    if (!formData.title || !formData.description || !formData.original_price || !formData.sale_price || !formData.qty_available) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires')
      return
    }

    if (parseFloat(formData.sale_price) >= parseFloat(formData.original_price)) {
      Alert.alert('Erreur', 'Le prix de vente doit être inférieur au prix original')
      return
    }

    try {
      setLoading(true)
      
      console.log('=== DÉBUT MODIFICATION PANIER ===')
      console.log('ID du panier:', id)
      console.log('Données à modifier:', formData)

      const updateData = {
        title: formData.title,
        description: formData.description,
        original_price: parseFloat(formData.original_price),
        sale_price: parseFloat(formData.sale_price),
        qty_available: parseInt(formData.qty_available),
        pickup_start: formData.pickup_start ? new Date(formData.pickup_start).toISOString() : basket?.pickup_start,
        pickup_end: formData.pickup_end ? new Date(formData.pickup_end).toISOString() : basket?.pickup_end,
        photo_url: formData.photo_url || basket?.photo_url
      }

      console.log('Données de mise à jour:', updateData)

      const { error } = await supabase
        .from('baskets')
        .update(updateData)
        .eq('id', id)

      if (error) {
        console.log('Erreur lors de la mise à jour:', error)
        throw error
      }

      console.log('=== PANIER MODIFIÉ AVEC SUCCÈS ===')

      Alert.alert('Succès', 'Panier modifié avec succès', [
        { text: 'OK', onPress: () => router.back() }
      ])
    } catch (error) {
      console.error('Erreur lors de la modification:', error)
      Alert.alert('Erreur', `Impossible de modifier le panier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    } finally {
      setLoading(false)
    }
  }

  const deleteBasket = async () => {
    Alert.alert(
      'Supprimer le panier',
      `Êtes-vous sûr de vouloir supprimer "${basket?.title}" ?`,
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
                .eq('id', id)
              
              if (error) throw error
              
              Alert.alert('Succès', 'Panier supprimé avec succès', [
                { text: 'OK', onPress: () => router.replace('/(merchant)/baskets') }
              ])
            } catch (error) {
              console.error('Erreur lors de la suppression:', error)
              Alert.alert('Erreur', 'Impossible de supprimer le panier')
            }
          }
        }
      ]
    )
  }

  const toggleStatus = async () => {
    if (!basket) return

    const newStatus = basket.status === 'active' ? 'expired' : 'active'
    const action = newStatus === 'active' ? 'activer' : 'désactiver'
    
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} le panier`,
      `Êtes-vous sûr de vouloir ${action} "${basket.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('baskets')
                .update({ status: newStatus })
                .eq('id', id)
              
              if (error) throw error
              
              Alert.alert('Succès', `Panier ${action}é avec succès`, [
                { text: 'OK', onPress: () => router.back() }
              ])
            } catch (error) {
              console.error('Erreur lors de la modification:', error)
              Alert.alert('Erreur', `Impossible de ${action} le panier`)
            }
          }
        }
      ]
    )
  }

  if (initialLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Chargement...</Text>
      </View>
    )
  }

  if (!basket) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>Panier non trouvé</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Modifier le Panier</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.form}>
          <Text style={styles.label}>Titre du panier *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Panier Pain & Viennoiseries"
            value={formData.title}
            onChangeText={(value) => handleInputChange('title', value)}
          />

          <Text style={styles.label}>Description *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Décrivez le contenu du panier..."
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            multiline
            numberOfLines={4}
          />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Prix original (DA) *</Text>
              <TextInput
                style={styles.input}
                placeholder="1200"
                value={formData.original_price}
                onChangeText={(value) => handleInputChange('original_price', value)}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Prix de vente (DA) *</Text>
              <TextInput
                style={styles.input}
                placeholder="600"
                value={formData.sale_price}
                onChangeText={(value) => handleInputChange('sale_price', value)}
                keyboardType="numeric"
              />
            </View>
          </View>

          <Text style={styles.label}>Quantité disponible *</Text>
          <TextInput
            style={styles.input}
            placeholder="5"
            value={formData.qty_available}
            onChangeText={(value) => handleInputChange('qty_available', value)}
            keyboardType="numeric"
          />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Début récupération</Text>
              <TextInput
                style={styles.input}
                placeholder="2024-01-01T17:00"
                value={formData.pickup_start}
                onChangeText={(value) => handleInputChange('pickup_start', value)}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Fin récupération</Text>
              <TextInput
                style={styles.input}
                placeholder="2024-01-01T19:00"
                value={formData.pickup_end}
                onChangeText={(value) => handleInputChange('pickup_end', value)}
              />
            </View>
          </View>

          <Text style={styles.label}>{`URL de l'image`}</Text>
          <TextInput
            style={styles.input}
            placeholder="https://exemple.com/image.jpg"
            value={formData.photo_url}
            onChangeText={(value) => handleInputChange('photo_url', value)}
          />

          {/* Actions */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.updateBtn, loading && styles.disabledBtn]} 
              onPress={updateBasket}
              disabled={loading}
            >
              <Text style={styles.updateBtnText}>
                {loading ? 'Modification...' : 'Modifier le panier'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.toggleBtn, { 
                backgroundColor: basket.status === 'active' ? theme.colors.danger : theme.colors.success 
              }]} 
              onPress={toggleStatus}
            >
              <Text style={styles.toggleBtnText}>
                {basket.status === 'active' ? 'Désactiver' : 'Activer'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.deleteBtn} 
              onPress={deleteBasket}
            >
              <Text style={styles.deleteBtnText}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  form: {
    gap: theme.spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.md,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  actionButtons: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  updateBtn: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  disabledBtn: {
    backgroundColor: theme.colors.textMuted,
  },
  updateBtnText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  toggleBtn: {
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  toggleBtnText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteBtn: {
    backgroundColor: theme.colors.danger,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  loading: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
    color: theme.colors.textMuted,
  },
  error: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
    color: theme.colors.danger,
  },
}) 