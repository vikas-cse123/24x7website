// One-time MongoDB audit (read-only)
import 'dotenv/config'
import mongoose from 'mongoose'

const uri = process.env.MONGODB_URI
console.log('MONGODB_URI in use:', uri)

// Safety gate: only proceed against the local dev database.
if (!/^mongodb:\/\/127\.0\.0\.1:27017\//.test(uri || '')) {
  console.error('ABORT: MONGODB_URI does not point to local mongodb://127.0.0.1:27017/')
  process.exit(1)
}

await mongoose.connect(uri)
const db = mongoose.connection.db
const dbName = db.databaseName
console.log('DATABASE NAME:', dbName, '\n')

const collections = await db.listCollections().toArray()
const names = collections.map((c) => c.name)

const counts = {}
for (const name of names) {
  counts[name] = await db.collection(name).countDocuments()
}
console.log('ALL COLLECTION COUNTS:')
for (const [n, c] of Object.entries(counts)) console.log(`  ${n}: ${c}`)

// Catalog-scoped sub-reports
const destIds = (await db.collection('destinations').find({}, { projection: { _id: 1 } }).toArray()).map((d) => d._id)
const tripIds = (await db.collection('trips').find({}, { projection: { _id: 1 } }).toArray()).map((t) => t._id)

const inArr = (arr) => ({ $in: arr })

const faqScoped = await db.collection('faqs').countDocuments({ $or: [{ destinationId: { $ne: null } }, { tripId: { $ne: null } }] })
const faqGlobal = await db.collection('faqs').countDocuments({ destinationId: null, tripId: null })

const bookingsRef = await db.collection('bookings').countDocuments({ tripId: inArr(tripIds) })
const reviewsRef = await db.collection('reviews').countDocuments({ tripId: inArr(tripIds) })
const enquiriesDest = await db.collection('enquiries').countDocuments({ destinationId: inArr(destIds) })
const wishlistTrips = await db.collection('wishlists').countDocuments({ itemType: 'trip', itemId: inArr(tripIds) })
const wishlistDests = await db.collection('wishlists').countDocuments({ itemType: 'destination', itemId: inArr(destIds) })
const blogsDest = await db.collection('blogs').countDocuments({ destinationId: inArr(destIds) })
const notifTrips = await db.collection('notifications').countDocuments({ relatedEntityType: { $in: ['trip', 'trip_batch', 'destination'] }, relatedEntityId: inArr([...tripIds, ...destIds]) })

// S3 publicIds referenced by catalog docs
const destDocs = await db.collection('destinations').find({}, { projection: { 'heroImage.publicId': 1, 'gallery.publicId': 1 } }).toArray()
const tripDocs = await db.collection('trips').find({}, { projection: { 'heroImage.publicId': 1, 'gallery.publicId': 1 } }).toArray()
const pubIds = new Set()
for (const d of destDocs) {
  if (d.heroImage?.publicId) pubIds.add(d.heroImage.publicId)
  for (const g of d.gallery || []) if (g.publicId) pubIds.add(g.publicId)
}
for (const t of tripDocs) {
  if (t.heroImage?.publicId) pubIds.add(t.heroImage.publicId)
  for (const g of t.gallery || []) if (g.publicId) pubIds.add(g.publicId)
}
const tripMediaPubs = await db.collection('tripmedias').distinct('publicId')
for (const p of tripMediaPubs) if (p) pubIds.add(p)

const byPrefix = {}
for (const p of pubIds) {
  const key = p.split('/').slice(0, 2).join('/')
  byPrefix[key] = (byPrefix[key] || 0) + 1
}
console.log('\nS3 publicIds referenced by catalog docs, by prefix:')
for (const [k, v] of Object.entries(byPrefix)) console.log(`  ${k}: ${v}`)
const destMediaRefs = [...pubIds].filter((p) => p.startsWith('travel-crm/destination-media/'))
console.log('\ndestination-media publicIds referenced by catalog docs:', destMediaRefs.length)
for (const p of destMediaRefs) console.log('  ', p)

// AppSetting keys (to confirm what we preserve)
const settings = await db.collection('appsettings').find({}, { projection: { key: 1 } }).toArray()
console.log('\nAppSetting keys (preserved):', settings.map((s) => s.key).join(', '))

console.log('\nCATALOG-SCOPED CROSS-REF SUMMARY (these docs reference catalog but are NOT catalog):')
console.log(`  faqs scoped to destination/trip: ${faqScoped} (global: ${faqGlobal})`)
console.log(`  bookings referencing trips: ${bookingsRef}`)
console.log(`  reviews referencing trips: ${reviewsRef}`)
console.log(`  enquiries referencing destinations: ${enquiriesDest}`)
console.log(`  wishlists -> trips: ${wishlistTrips}, -> destinations: ${wishlistDests}`)
console.log(`  blogs referencing destinations: ${blogsDest}`)
console.log(`  notifications referencing trips/batches/destinations: ${notifTrips}`)

await mongoose.disconnect()
process.exit(0)
