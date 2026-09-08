export const TRIP_DISCOUNTS = [2000, 3000, 5000, 7000, 8000]

function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  }
  return hash
}

export function getDeterministicDiscount(trip) {
  const key = String(trip.id || trip._id || trip.tripCode || trip.slug || trip.name || '')
  let h = hashString(key)
  // Mix startingPrice to ensure different prices distribute even with same slug pattern
  if (trip.startingPrice != null) {
    h = (h ^ (Number(trip.startingPrice) * 997)) >>> 0
  }
  return TRIP_DISCOUNTS[h % TRIP_DISCOUNTS.length]
}

export function resolveTripPricing(trip) {
  const sp = trip.startingPrice
  if (sp == null || Number(sp) <= 0) return { originalPrice: null, discount: null }
  const op = trip.originalPrice
  if (op != null && Number(op) > Number(sp)) {
    return { originalPrice: Number(op), discount: Number(op) - Number(sp) }
  }
  const discount = getDeterministicDiscount(trip)
  return { originalPrice: Number(sp) + discount, discount }
}
