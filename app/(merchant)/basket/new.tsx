import { router } from 'expo-router'
import React, { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { theme } from '../../../constants/theme'
import { supabase } from '../../../lib/supabase'

export default function NewBasket() {
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const createBasket = async () => {
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
      
      console.log('=== DÉBUT CRÉATION PANIER ===')
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utilisateur non connecté')
      
      console.log('Utilisateur connecté:', user.id)
      console.log('Email utilisateur:', user.email)

      // Récupérer l'ID du marchand avec debug
      console.log('Recherche du marchand avec owner_id:', user.id)
      
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('id, name, owner_id')
        .eq('owner_id', user.id)
        .single()

      console.log('Résultat recherche marchand:', merchant)
      console.log('Erreur recherche marchand:', merchantError)

      if (merchantError) {
        console.log('Erreur détaillée:', merchantError)
        throw new Error(`Erreur lors de la recherche du marchand: ${merchantError.message}`)
      }

      if (!merchant) {
        console.log('Aucun marchand trouvé pour cet utilisateur')
        throw new Error('Marchand non trouvé')
      }

      console.log('Marchand trouvé:', merchant)

      // Créer le panier
      const basketData = {
        merchant_id: merchant.id,
        title: formData.title,
        description: formData.description,
        original_price: parseFloat(formData.original_price),
        sale_price: parseFloat(formData.sale_price),
        qty_available: parseInt(formData.qty_available),
        pickup_start: formData.pickup_start || new Date().toISOString(),
        pickup_end: formData.pickup_end || new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // +4h
        photo_url: formData.photo_url || 'https://images.unsplash.com/photo-1509440151596-2c6ad2f7b7a8?w=400',
        status: 'active'
      }

      console.log('Données du panier à créer:', basketData)

      const { error } = await supabase
        .from('baskets')
        .insert(basketData)

      if (error) {
        console.log('Erreur lors de l\'insertion:', error)
        throw error
      }

      console.log('=== PANIER CRÉÉ AVEC SUCCÈS ===')

      Alert.alert('Succès', 'Panier créé avec succès', [
        { text: 'OK', onPress: () => router.back() }
      ])
    } catch (error) {
      console.error('Erreur lors de la création:', error)
      const msg = error instanceof Error ? error.message : String(error)
      Alert.alert('Erreur', `Impossible de créer le panier: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Nouveau Panier</Text>
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

          <Text style={styles.label}>{`URL de l'image`}</Text>
          <TextInput
            style={styles.input}
            placeholder="https://exemple.com/image.jpg"
            value={formData.photo_url}
            onChangeText={(value) => handleInputChange('photo_url', value)}
          />

          <TouchableOpacity 
            style={[styles.createBtn, loading && styles.disabledBtn]} 
            onPress={createBasket}
            disabled={loading}
          >
            <Text style={styles.createBtnText}>
              {loading ? 'Création...' : 'Créer le panier'}
            </Text>
          </TouchableOpacity>
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
  createBtn: {
    backgroundColor: theme.colors.success,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  disabledBtn: {
    backgroundColor: theme.colors.textMuted,
  },
  createBtnText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
}) 