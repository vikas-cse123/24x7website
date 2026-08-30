// Mapping from destination name (normalized) to local image filename in /destination-images/
const IMAGE_MAP = {
  'almaty': 'almaty.webp',
  'andaman': 'andman.webp',
  'andaman and nicobar': 'andman.webp',
  'baku': 'Baku.avif',
  'bali': 'bali.webp',
  'bhutan': 'bhutan.avif',
  'cambodia': 'cambodia.avif',
  'dubai': 'dubai.avif',
  'egypt': 'egypt.avif',
  'europe': 'europe.avif',
  'georgia': 'georgia.avif',
  'himachal pradesh': 'himachal pradesh.webp',
  'himachal': 'himachal pradesh.webp',
  'japan': 'japan.avif',
  'kashmir': 'kashmir.avif',
  'kerala': 'kerala.avif',
  'ladakh': 'ladakh.avif',
  'malaysia': 'malaysia.avif',
  'maldives': 'maldives.avif',
  'manali': 'manali.webp',
  'meghalaya': 'meghalaya.avif',
  'nepal': 'nepal.avif',
  'northern lights': 'northern lights.avif',
  'oman': 'oman.avif',
  'philippines': 'Philippines.avif',
  'rajasthan': 'rajasthan.avif',
  'singapore': 'singapore.webp',
  'spain with ibiza': 'spain-with-ibiza.avif',
  'spain': 'spain-with-ibiza.avif',
  'spiti valley': 'spiti valley.avif',
  'tawang': 'tawang.avif',
  'thailand': 'thailand.avif',
  'uttarakhand': 'uttarakhand.webp',
  'vietnam': 'vietnam.webp',
}

// Ordered list for "All" as per spec – deliberate, not alphabetical
export const ALL_ORDER = [
  'Sri Lanka',
  'Meghalaya',
  'Vietnam',
  'Spiti Valley',
  'Bali',
  'Ladakh',
  'Thailand',
  'Tawang',
  'Europe',
  'Andaman',
  'Bhutan',
  'Himachal Pradesh',
  'Japan',
  'Manali',
  'Nepal',
  'Kerala',
  'Almaty',
  'Uttarakhand',
  'Georgia',
  'Rajasthan',
  'Spain with Ibiza',
  'Kashmir',
  'Maldives',
  'Singapore',
  'Egypt',
  'Northern Lights',
  'Cambodia',
  'Malaysia',
  'Baku',
  'Oman',
  'Philippines',
  'Dubai',
]

function normalizeName(name) {
  return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ')
}

export function getLocalImageForDestination(destination) {
  if (!destination) return null
  const nameKey = normalizeName(destination.name)
  const slugKey = normalizeName(destination.slug?.replace(/-/g, ' '))
  // Try name first, then slug, then country
  let filename = IMAGE_MAP[nameKey] || IMAGE_MAP[slugKey]
  if (!filename) {
    // Try to match by includes (e.g., "Bali" matches "bali-honeymoon-packages" slug)
    const lowerName = nameKey
    for (const [key, file] of Object.entries(IMAGE_MAP)) {
      if (lowerName.includes(key) || key.includes(lowerName)) {
        filename = file
        break
      }
    }
  }
  if (!filename) {
    // Try country
    const countryKey = normalizeName(destination.country)
    filename = IMAGE_MAP[countryKey]
  }
  if (!filename) return null
  // Encode URI for spaces and case-sensitive files – keep exact filename
  return `/destination-images/${encodeURI(filename)}`
}

export function sortDestinationsForAll(destinations) {
  const orderMap = new Map()
  ALL_ORDER.forEach((name, idx) => orderMap.set(normalizeName(name), idx))
  return [...destinations].sort((a, b) => {
    const aIdx = orderMap.has(normalizeName(a.name)) ? orderMap.get(normalizeName(a.name)) : 999
    const bIdx = orderMap.has(normalizeName(b.name)) ? orderMap.get(normalizeName(b.name)) : 999
    if (aIdx !== bIdx) return aIdx - bIdx
    // Fallback to displayOrder if available, then name
    if (a.displayOrder !== undefined && b.displayOrder !== undefined) return a.displayOrder - b.displayOrder
    return String(a.name).localeCompare(String(b.name))
  })
}
