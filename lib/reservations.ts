// Toute la logique métier de réservation
export const createReservation = async (basketId: string, customerId: string, quantity: number) => {
  // Validation, création, génération de codes, etc.
}

export const validatePickupCode = async (pickupCode: string) => {
  // Validation du code de récupération
}

export const confirmPickup = async (reservationId: string) => {
  // Confirmation du retrait
}
