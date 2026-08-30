/**
 * ONE-TIME catalog cleanup: removes ALL destination/trip catalog data.
 *
 * Deletes (in dependency order):
 *   1. tripmedias     (child of trips)
 *   2. tripbatches    (child of trips)
 *   3. trips          (child of destinations)
 *   4. destinations
 *   5. faqs scoped to a destination/trip (cannot exist independently; global FAQs kept)
 *
 * PRESERVES: users, appsettings (whatsapp/branding), bookings, reviews,
 * enquiries, wishlists, notifications, blogs — all user/application data.
 *
 * Idempotent: deleting empty collections is a no-op; safe to run twice.
 *
 * Usage:
 *   node scripts/clear-travel-catalog.mjs          # dry run: prints report only
 *   node scripts/clear-travel-catalog.mjs --yes    # actually deletes
 *
 * S3 media is handled separately by scripts/clear-travel-catalog-s3.mjs.
 */
import 'dotenv/config'
import mongoose from 'mongoose'

const uri = process.env.MONGODB_URI
const APPLY = process.argv.includes('--yes')

// Safety gate: this script must never run against a remote/production DB.
if (!/^mongodb:\/\/127\.0\.0\.1:27017\//.test(uri || '')) {
  console.error('ABORT: MONGODB_URI does not point to the local dev database (mongodb://127.0.0.1:27017/).')
  console.error('Refusing to delete anything. URI in use:', uri)
  process.exit(1)
}

await mongoose.connect(uri)
const db = mongoose.connection.db

const dbName = db.databaseName
console.log('Database:', dbName)
console.log('Mode:', APPLY ? 'APPLY (will delete)' : 'DRY RUN (report only)')
console.log('')

// Verify expected collections exist before touching anything.
const required = ['destinations', 'trips', 'tripbatches']
const existing = (await db.listCollections().toArray()).map((c) => c.name)
for (const name of required) {
  if (!existing.includes(name)) {
    console.error(`ABORT: expected collection "${name}" not found in ${dbName}. Wrong database?`)
    await mongoose.disconnect()
    process.exit(1)
  }
}

async function countOf(name) {
  return (await db.listCollections().toArray()).some((c) => c.name === name)
    ? db.collection(name).countDocuments()
    : 0
}

const plan = [
  { name: 'tripmedias', filter: {} },
  { name: 'tripbatches', filter: {} },
  { name: 'trips', filter: {} },
  { name: 'destinations', filter: {} },
  // Only catalog-scoped FAQs (bound to a destination/trip); global FAQs stay.
  { name: 'faqs', filter: { $or: [{ destinationId: { $ne: null } }, { tripId: { $ne: null } }] } },
]

console.log('PRE-DELETE REPORT:')
const before = {}
for (const step of plan) {
  before[step.name] = await countOf(step.name)
  const label = Object.keys(step.filter).length ? ' (catalog-scoped only)' : ''
  console.log(`  ${step.name}${label}: ${before[step.name]}`)
}

const preserved = ['users', 'appsettings', 'bookings', 'reviews', 'enquiries', 'wishlists', 'notifications', 'blogs', 'travellers']
console.log('\nPRESERVED (untouched):')
for (const name of preserved) console.log(`  ${name}: ${await countOf(name)}`)

if (!APPLY) {
  console.log('\nDry run complete. Re-run with --yes to delete.')
  await mongoose.disconnect()
  process.exit(0)
}

console.log('\nDeleting (child records first)...')
const deleted = {}
for (const step of plan) {
  const res = await db.collection(step.name).deleteMany(step.filter)
  deleted[step.name] = res.deletedCount
  console.log(`  ${step.name}: deleted ${res.deletedCount}`)
}

console.log('\nPOST-DELETE REPORT:')
for (const step of plan) console.log(`  ${step.name}: ${await countOf(step.name)} remaining`)
for (const name of preserved) console.log(`  ${name} (preserved): ${await countOf(name)}`)

console.log('\nDone.')
await mongoose.disconnect()
process.exit(0)
