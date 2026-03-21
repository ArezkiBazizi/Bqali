// Génération d'un code de retrait à 6 chiffres
export const generatePickupCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// Génération du payload QR
export const generateQRPayload = (basketId: string, code: string): string => {
  const payload = {
    basket_id: basketId,
    code: code,
    ts: Date.now()
  }
  return JSON.stringify(payload)
}

// Calcul de la distance entre deux points (formule de Haversine)
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371 // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Formatage du prix
export const formatPrice = (price: number): string => {
  return `${price.toFixed(2)} DA`
}

// Formatage de la date de retrait
export const formatPickupTime = (start: string, end: string): string => {
  const startDate = new Date(start)
  const endDate = new Date(end)
  
  const startTime = startDate.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  const endTime = endDate.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
  
  return `${startTime} - ${endTime}`
}

// Calcul du pourcentage de réduction
export const calculateDiscount = (original: number, sale: number): number => {
  return Math.round(((original - sale) / original) * 100)
}

// Vérification si le créneau de retrait est actif
export const isPickupActive = (start: string, end: string): boolean => {
  const now = new Date()
  const startTime = new Date(start)
  const endTime = new Date(end)
  
  return now >= startTime && now <= endTime
}

/** Texte lisible pour PostgREST / Supabase / erreurs inconnues (évite « Object » en console). */
export function formatErrorMessage(error: unknown): string {
  if (error == null) return 'Erreur inconnue'
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message || error.name
  if (typeof error === 'object') {
    const o = error as Record<string, unknown>
    const msg = o.message
    if (typeof msg === 'string' && msg.length) return msg
    const details = o.details
    if (typeof details === 'string' && details.length) return details
    const hint = o.hint
    if (typeof hint === 'string' && hint.length) return hint
    const code = o.code
    if (typeof code === 'string' && code.length) return `Erreur ${code}`
    try {
      return JSON.stringify(error)
    } catch {
      return String(error)
    }
  }
  return String(error)
}