// Central registry of S3 media folders. This is the ONLY place that maps a
// logical entity to an S3 storage path — renames/changes are one-file.
export const IMAGE_FOLDERS = {
  destinations: 'destinations',
  trips: 'trips',
  blogs: 'blogs',
  website: 'website',
  // TripForm hero/gallery uploads (trip-owned media)
  'trip-media': 'trips',
  // Admin Media page uploads → stored as TripMedia records
  'traveler-media': 'trip-media',
  // Destination form hero/gallery uploads
  'destination-media': 'destinations',
  // Blog form cover uploads
  'blog-media': 'blogs',
  // admin-managed website branding (logo uploads)
  'brand-media': 'branding',
  'whatsapp-media': 'whatsapp',
  // logical buckets for future masters; keep centralized so renames are one-file
  hotels: 'hotels',
  sightseeing: 'sightseeing',
  vehicles: 'vehicles',
  'vibe-videos': 'vibe-videos',
}

// Legacy S3 prefix used by all uploads before the clean-path migration.
// Existing objects under this prefix are intentionally KEPT: records may
// still reference them and cleanup/deletion must continue to work on them.
export const LEGACY_KEY_PREFIX = 'travel-crm/'

// Top-level prefixes that NEW uploads may use (everything except the legacy
// prefix). Used by key validation (s3 delete guard) and by the cleanup
// reference checker so BOTH old and new keys are understood.
export const KEY_PREFIXES = [
  ...new Set([
    ...Object.values(IMAGE_FOLDERS),
    'tests', // reserved for automated test artifacts
  ]),
]

// True when the string is an app-managed S3 object key — either a legacy
// `travel-crm/...` key or a new clean-prefix key. Path-traversal segments
// are always rejected.
export function isAppKey(key) {
  if (typeof key !== 'string') return false
  if (/(^|\/)\.\.(\/|$)/.test(key)) return false
  if (key.startsWith(LEGACY_KEY_PREFIX)) return true
  return KEY_PREFIXES.some((prefix) => key.startsWith(`${prefix}/`))
}

export function folderFor(entity, id) {
  const base = IMAGE_FOLDERS[entity] || IMAGE_FOLDERS.website
  return id ? `${base}/${id}` : base
}
