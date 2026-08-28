export const IMAGE_FOLDERS = {
  destinations: 'travel-crm/destinations',
  trips: 'travel-crm/trips',
  blogs: 'travel-crm/blogs',
  website: 'travel-crm/website',
  // media uploaded through the admin Media page / traveler-generated media
  'trip-media': 'travel-crm/trip-media',
  'traveler-media': 'travel-crm/traveler-media',
  'destination-media': 'travel-crm/destination-media',
  'blog-media': 'travel-crm/blog-media',
  // logical buckets for future masters; keep centralized so renames are one-file
  hotels: 'travel-crm/hotels',
  sightseeing: 'travel-crm/sightseeing',
  vehicles: 'travel-crm/vehicles',
}

export function folderFor(entity, id) {
  const base = IMAGE_FOLDERS[entity] || IMAGE_FOLDERS.website
  return id ? `${base}/${id}` : base
}
