import { supabase } from './supabase'
import { generatePickupCode, generateQRPayload } from './utils'

// Types
export interface Basket {
  id: string
  merchant_id: string
  title: string
  description: string
  original_price: number
  sale_price: number
  qty_available: number
  pickup_start: string
  pickup_end: string
  photo_url: string
  status: 'active' | 'soldout' | 'expired'
  created_at: string
  merchants?: {
    name: string
    lat: number
    lng: number
    address: string
    city: string
    owner_id?: string
  }
}

export interface Reservation {
  id: string
  basket_id: string
  customer_id: string
  reserved_qty: number
  amount_due: number
  pay_method: 'cash' | 'edahabia' | 'baridimob'
  status: 'pending_email_verification' | 'pending' | 'picked' | 'cancelled' | 'no_show'
  pickup_code: string
  pickup_qr: string
  email_verification_code?: string
  email_verification_expires_at?: string
  email_verified_at?: string
  expires_at: string
  created_at: string
}

// API Functions
export const api = {
  // Baskets
  getActiveBaskets: async () => {
    try {
      console.log('=== DÉBUT getActiveBaskets ===')
      
      // TEST 1: Récupérer TOUS les marchands d'abord
      const { data: allMerchants, error: allMerchantsError } = await supabase
        .from('merchants')
        .select('*')
      
      console.log('TEST 1 - TOUS les marchands:', allMerchants)
      console.log('TEST 1 - Erreur:', allMerchantsError)
      
      // TEST 2: Essayer avec le schéma public
      const { data: allMerchantsPublic, error: allMerchantsPublicError } = await supabase
        .from('public.merchants')
        .select('*')
      
      console.log('TEST 2 - Marchands avec schéma public:', allMerchantsPublic)
      console.log('TEST 2 - Erreur:', allMerchantsPublicError)
      
      // TEST 3: Essayer de récupérer juste le count
      const { count: merchantsCount, error: countError } = await supabase
        .from('merchants')
        .select('*', { count: 'exact', head: true })
      
      console.log('TEST 3 - Nombre de marchands:', merchantsCount)
      console.log('TEST 3 - Erreur count:', countError)
      
      // Récupérer d'abord les paniers
      const { data: baskets, error: basketsError } = await supabase
        .from('baskets')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
      
      if (basketsError) {
        console.log('Erreur baskets:', basketsError)
        throw basketsError
      }
      
      console.log('Paniers récupérés:', baskets?.length)
      
      // Récupérer les marchands correspondants
      const merchantIds = baskets?.map(basket => basket.merchant_id).filter(Boolean) || []
      
      console.log('IDs des marchands demandés:', merchantIds)
      
      if (merchantIds.length === 0) {
        console.log('Aucun merchant_id trouvé')
        return baskets as Basket[]
      }
      
      // JOINTURE : Récupérer les marchands avec leurs IDs
      const { data: merchants, error: merchantsError } = await supabase
        .from('merchants')
        .select('id, name, lat, lng, address, city, owner_id')
        .in('id', merchantIds)
      
      if (merchantsError) {
        console.log('Erreur merchants:', merchantsError)
        throw merchantsError
      }
      
      console.log('Marchands récupérés:', merchants)
      console.log('Nombre de marchands récupérés:', merchants?.length)
      
      // JOINTURE : Pour chaque panier, trouver le marchand correspondant
      const basketsWithMerchants = baskets?.map(basket => {
        // Jointure : merchant_id du panier = id du marchand
        const merchant = merchants?.find(merchant => merchant.id === basket.merchant_id)
        
        console.log(`JOINTURE: Panier ${basket.id} -> merchant_id: ${basket.merchant_id} -> Marchand trouvé:`, merchant)
        
        return {
          ...basket,
          merchants: merchant || null
        }
      })
      
      console.log('=== FIN getActiveBaskets ===')
      return basketsWithMerchants as Basket[]
    } catch (error) {
      console.log('ERREUR dans getActiveBaskets:', error)
      throw error
    }
  },

  getBasketById: async (id: string) => {
    const { data, error } = await supabase
      .from('baskets')
      .select('*, merchants(*)')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data as Basket
  },

  createBasket: async (basketData: Omit<Basket, 'id' | 'created_at' | 'status'>) => {
    const { data, error } = await supabase
      .from('baskets')
      .insert(basketData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Reservations
  createReservation: async (reservationData: Omit<Reservation, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('reservations')
      .insert(reservationData)
      .select()
      .single()
    
    if (error) throw error
    return data as Reservation
  },

  // Réserve un panier (basket) et lance le processus de vérification par email.
  // Utilisé à la fois quand l'utilisateur réserve direct, et quand il réserve depuis le panier (cart).
  reserveBasketWithEmail: async (
    basket: Basket,
    quantity: number = 1,
    payMethod: Reservation['pay_method'] = 'cash'
  ): Promise<Reservation> => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('Utilisateur non connecté')
    if (!user.email) throw new Error('Email utilisateur manquant')

    // IMPORTANT: la table reservations a une FK vers `users(id)`.
    // Si l'utilisateur n'a pas encore de ligne dans `users`, l'insert échoue (409/500 selon cas).
    const { error: upsertUserError } = await supabase
      .from('users')
      .upsert(
        {
          id: user.id,
          email: user.email,
          role: 'customer',
          phone: (user.user_metadata as any)?.phone || null,
        },
        { onConflict: 'id' }
      )

    if (upsertUserError) {
      // On remonte une erreur explicite: il faut que la table `users` soit alimentée.
      throw new Error(`Impossible de créer/vérifier le profil user: ${upsertUserError.message}`)
    }

    if (!basket || basket.qty_available <= 0) {
      throw new Error('Indisponible')
    }

    const pickup_code = generatePickupCode()
    const pickup_qr = generateQRPayload(basket.id, pickup_code)

    // Code de vérification email (6 chiffres)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const emailExpiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const reservationPayload: Omit<Reservation, 'id' | 'created_at'> = {
      basket_id: basket.id,
      customer_id: user.id,
      reserved_qty: quantity,
      amount_due: basket.sale_price * quantity,
      pay_method: payMethod,
      status: 'pending_email_verification',
      pickup_code,
      pickup_qr,
      expires_at: new Date(new Date(basket.pickup_end).getTime()).toISOString(),
      email_verification_code: verificationCode,
      email_verification_expires_at: emailExpiresAt,
    }

    let reservation: Reservation
    try {
      reservation = await api.createReservation(reservationPayload)
    } catch (e: any) {
      // Cas fréquent: contrainte unique -> une réservation existe déjà.
      // On renvoie juste un nouvel email si c'est une réservation en attente de vérification.
      const statusCode = e?.statusCode ?? e?.status ?? e?.code
      const msg = String(e?.message || '')
      const looksLikeConflict = statusCode === 409 || /conflict|duplicate|unique/i.test(msg)

      console.log('Conflit réservation détecté:', { statusCode, msg })
      if (!looksLikeConflict) throw e

      const { data: existing, error: existingError } = await supabase
        .from('reservations')
        .select('id, status')
        .eq('basket_id', basket.id)
        .eq('customer_id', user.id)
        .in('status', ['pending_email_verification', 'pending'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existingError) throw e

      if (existing?.status === 'pending_email_verification') {
        await api.resendVerificationEmail(existing.id)
        return existing as Reservation
      }

      // Si la réservation existe déjà mais n'est pas dans pending_email_verification,
      // on laisse l'app décider (souvent: afficher les infos existantes).
      return existing as Reservation
    }

    // Le nom du marchand est utilisé dans le template email.
    const merchantName = basket.merchants?.name || ''
    const basketTitle = basket.title || ''

    const { error: invokeError } = await supabase.functions.invoke('send-verification-email', {
      body: {
        reservationId: reservation.id,
        email: user.email,
        verificationCode,
        basketTitle,
        merchantName,
      },
    })

    if (invokeError) {
      // Si l'email échoue, on remonte l'erreur pour que l'utilisateur sache que la vérification email n'est pas partie.
      // (Optionnel: on pourrait mettre le statut à une valeur "email_failed" côté DB.)
      throw invokeError
    }

    return reservation
  },

  getReservationByBasketId: async (basketId: string) => {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('basket_id', basketId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error) throw error
    return data as Reservation
  },

  updateReservationStatus: async (id: string, status: Reservation['status']) => {
    const { data, error } = await supabase
      .from('reservations')
      .update({ status })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Nouvelle fonction pour récupérer une réservation avec tous les détails
  getReservationByBasketIdWithDetails: async (basketId: string) => {
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
          pickup_end,
          merchants!inner(
            name,
            address,
            city
          )
        )
      `)
      .eq('basket_id', basketId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error) throw error
    return data
  },

  // Nouvelle fonction pour récupérer les réservations d'un client
  getCustomerReservations: async (customerId: string) => {
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
          pickup_end,
          merchants!inner(
            name,
            address,
            city
          )
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Nouvelle fonction pour récupérer les réservations d'un marchand
  getMerchantReservations: async (merchantId: string) => {
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
      .eq('baskets.merchant_id', merchantId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Nouvelle fonction pour récupérer une réservation par ID avec tous les détails
  getReservationById: async (id: string) => {
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
          pickup_end,
          merchants!inner(
            name,
            address,
            city
          )
        )
      `)
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Owners & push tokens
  getBasketMerchantOwnerId: async (basketId: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from('baskets')
      .select('merchant_id, merchants(owner_id)')
      .eq('id', basketId)
      .single()
    if (error) return null
    const ownerId = (data as any)?.merchants?.owner_id as string | undefined
    return ownerId || null
  },

  getUserPushToken: async (userId: string): Promise<string | null> => {
    const { data, error } = await supabase
      .from('users')
      .select('push_token')
      .eq('id', userId)
      .single()
    if (error) return null
    return (data as any)?.push_token || null
  },

  // Auth
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  // Fonction pour vérifier le code email
  verifyReservationEmail: async (reservationId: string, code: string) => {
    const { data, error } = await supabase
      .from('reservations')
      .update({ 
        status: 'pending',
        email_verified_at: new Date().toISOString()
      })
      .eq('id', reservationId)
      .eq('email_verification_code', code)
      .eq('status', 'pending_email_verification')
      .gt('email_verification_expires_at', new Date().toISOString())
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Fonction pour renvoyer le code
  resendVerificationEmail: async (reservationId: string) => {
    // Générer un nouveau code
    const newCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Mettre à jour la réservation avec le nouveau code
    const { data, error } = await supabase
      .from('reservations')
      .update({ 
        email_verification_code: newCode,
        email_verification_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      })
      .eq('id', reservationId)
      .select(`
        *,
        baskets!inner(
          title,
          merchants!inner(name)
        )
      `)
      .single()
    
    if (error) throw error
    
    // Envoyer le nouvel email
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        const { error: invokeError } = await supabase.functions.invoke('send-verification-email', {
          body: {
            reservationId,
            email: user.email,
            verificationCode: newCode,
            basketTitle: data.baskets.title,
            merchantName: data.baskets.merchants.name,
          },
        })

        if (invokeError) throw invokeError
      }
    } catch (emailError) {
      console.error('Erreur envoi email:', emailError)
      // Ne pas faire échouer le renvoi pour une erreur d'email
    }
    
    return data
  }
} 