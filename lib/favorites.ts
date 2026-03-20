import { supabase } from './supabase'

export interface Favorite {
  id: string
  user_id: string
  basket_id: string
  created_at: string
  basket?: {
    id: string
    title: string
    description: string
    original_price: number
    sale_price: number
    photo_url?: string
    pickup_start: string
    pickup_end: string
    merchants?: {
      id: string
      name: string
      address?: string
      city?: string
    }
  }
}

export const addToFavorites = async (basketId: string): Promise<Favorite> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utilisateur non connecté')

    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: user.id,
        basket_id: basketId
      })
      .select(`
        *,
        basket:basket_id(
          id,
          title,
          description,
          original_price,
          sale_price,
          photo_url,
          pickup_start,
          pickup_end,
          merchants(
            id,
            name,
            address,
            city
          )
        )
      `)
      .single()

    if (error) throw error
    return data as Favorite
  } catch (error) {
    console.error('Erreur lors de l\'ajout aux favoris:', error)
    throw error
  }
}

export const removeFromFavorites = async (basketId: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utilisateur non connecté')

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('basket_id', basketId)

    if (error) throw error
  } catch (error) {
    console.error('Erreur lors de la suppression des favoris:', error)
    throw error
  }
}

export const getFavorites = async (): Promise<Favorite[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utilisateur non connecté')

    const { data, error } = await supabase
      .from('favorites')
      .select(`
        *,
        basket:basket_id(
          id,
          title,
          description,
          original_price,
          sale_price,
          photo_url,
          pickup_start,
          pickup_end,
          merchants(
            id,
            name,
            address,
            city
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []) as Favorite[]
  } catch (error) {
    console.error('Erreur lors de la récupération des favoris:', error)
    throw error
  }
}

export const isFavorite = async (basketId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('basket_id', basketId)
      .single()

    return !error && !!data
  } catch (error) {
    console.error('Erreur lors de la vérification des favoris:', error)
    return false
  }
}

export const toggleFavorite = async (basketId: string): Promise<boolean> => {
  try {
    const isFav = await isFavorite(basketId)
    
    if (isFav) {
      await removeFromFavorites(basketId)
      return false
    } else {
      await addToFavorites(basketId)
      return true
    }
  } catch (error) {
    console.error('Erreur lors du toggle des favoris:', error)
    throw error
  }
} 