import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'node:url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
import mongoose from 'mongoose'
import config from '../src/config/index.js'
await mongoose.connect(config.mongoUri)
console.log('MongoDB connected')

const Destination = (await import('../src/models/Destination.js')).default
const Trip = (await import('../src/models/Trip.js')).default
import { slugify, ensureUniqueSlug } from '../src/utils/slugify.js'

const tripName = '9 Days Northern Lights Backpacking Trip'

// Prevent duplicate
const existing = await Trip.findOne({ $or: [{ name: tripName }, { slug: slugify(tripName) }] }).lean()
if (existing) {
  console.log(`Trip already exists: ${existing.tripCode} ${existing.slug} ${existing._id}`)
  await mongoose.disconnect()
  process.exit(0)
}

// Find destination Northern Lights / Finland
let dest = await Destination.findOne({ $or: [
  { name: /northern.*lights/i },
  { slug: /northern.*lights/i },
  { name: /finland/i },
  { slug: /finland/i },
  { country: /finland/i },
]}).lean()

if (!dest) {
  console.log('Northern Lights / Finland destination not found, searching for Europe as fallback...')
  dest = await Destination.findOne({ slug: 'europe-tour-packages' }).lean()
}
if (!dest) {
  dest = await Destination.findOne({}).lean()
}
console.log(`Using destination: ${dest.name} | ${dest.slug} | ${dest._id} | country ${dest.country}`)

// Get next tripCode
const last = await Trip.find({ tripCode: /^TRP-\d+$/ }).select('tripCode').sort({ tripCode: -1 }).limit(1).lean()
let nextNum = 1
if (last.length) {
  const m = /^TRP-(\d+)$/.exec(last[0].tripCode)
  if (m) nextNum = Number(m[1]) + 1
}
const tripCode = `TRP-${String(nextNum).padStart(6, '0')}`
console.log(`Next tripCode: ${tripCode} (last was ${last[0]?.tripCode || 'none'})`)

let slug = slugify(tripName)
slug = await ensureUniqueSlug(Trip, slug)
console.log(`Generated slug: ${slug}`)

// Build cardImage from destination homepageImage
const cardImage = dest.homepageImage && (dest.homepageImage.publicId || dest.homepageImage.url) ? dest.homepageImage : dest.heroImage || {}
console.log(`cardImage source: ${cardImage.publicId || cardImage.url || 'empty'} from destination ${dest.name}`)

// Itinerary
const itinerary = [
  {
    dayNumber: 1,
    title: 'Touch Down in Stockholm | Sweden Welcomes You',
    description: `After landing in Stockholm, clear immigration and pick up your baggage.\nMake your way via transfer to your hostel and complete check-in.\nEnjoy Stockholm at leisure after settling in.\nTake an easy stroll through the neighbouring lanes and waterfront.\nExplore local cafés, bakeries, boutiques, quiet backstreets and buzzing squares.`,
    activities: [],
    meals: [],
    accommodation: '',
    notes: '',
  },
  { dayNumber: 2, title: 'Stockholm Sightseeing | Nordic Museum | Gamla Stan Walk', description: '', activities: [], meals: [], accommodation: '', notes: '' },
  { dayNumber: 3, title: 'Onward to Helsinki | Night Aboard a Baltic Cruise', description: '', activities: [], meals: [], accommodation: '', notes: '' },
  { dayNumber: 4, title: 'Land in Helsinki | Guided Walking Tour', description: '', activities: [], meals: [], accommodation: '', notes: '' },
  { dayNumber: 5, title: 'Rail Journey to Rovaniemi (Approx. 8–9 Hrs) | Into Finnish Lapland', description: '', activities: [], meals: [], accommodation: '', notes: '' },
  { dayNumber: 6, title: 'Santa Claus Village Visit | Husky Sledding | Aurora Hunt', description: '', activities: [], meals: [], accommodation: '', notes: '' },
  { dayNumber: 7, title: 'Open Day | Optional Arctic Activities', description: '', activities: [], meals: [], accommodation: '', notes: '' },
  { dayNumber: 8, title: 'Rail Back to Helsinki (Approx. 8–9 Hrs) | Back to the Capital', description: '', activities: [], meals: [], accommodation: '', notes: '' },
  { dayNumber: 9, title: 'Fly Out From Helsinki | Homeward With Northern Lights Memories', description: '', activities: [], meals: [], accommodation: '', notes: '' },
]

const inclusions = [
  "2 nights' stay in a Stockholm hostel",
  "1 night aboard the ferry in a 4-passenger cabin",
  "2 nights' stay in a Helsinki hostel",
  "3 nights' stay in a Rovaniemi hostel",
  "Stockholm sightseeing tour + Nordic Museum + Gamla Stan walk",
  "Guided Helsinki city tour",
  "Husky sledge ride",
  "Santa Claus Village visit",
  "Northern Lights hunting tour",
  "Train travel from Helsinki to Rovaniemi",
  "Train travel from Rovaniemi to Helsinki",
  "Round-the-clock on-call travel support",
]

const exclusions = [
  "GST charged separately",
  "TCS charged separately",
  "Airport pick-up and drop-off transfers",
  "New Year's party entry",
  "Airport transfers, CT tax and guide fees where applicable",
  "Food or drinks outside the package",
  "Personal expenses such as driver tips, camera/video fees, laundry, phone bills, etc.",
  "Expenses arising from natural events such as landslides or blocked roads",
  "Anything not specifically listed under inclusions",
  "Costs related to flight delays or schedule changes",
  "Flights, visa and insurance",
  "Tips for guides and drivers",
  "Personal expenses",
  "Extra activities beyond planned tours",
  "Visa fees",
  "Medical insurance",
]

const costing = [
  { mode: 'Double Sharing (Hostel)', price: 179999, originalPrice: 184999 },
]

const departures = [
  new Date('2025-11-20T00:00:00Z'),
  new Date('2025-12-18T00:00:00Z'),
  new Date('2026-01-02T00:00:00Z'),
  new Date('2026-01-08T00:00:00Z'),
  new Date('2026-03-04T00:00:00Z'),
]

const notes = `Airport pickup is at a fixed time depending on the majority of arrival time of the group members.\nItinerary may change based on factors such as extreme weather conditions, road conditions and the physical capabilities of participants. Changes will be made with consideration for safety, comfort and overall wellbeing.`

const docData = {
  destinationId: dest._id,
  name: tripName,
  cardName: tripName,
  pageHeading: tripName,
  slug,
  tripCode,
  shortDescription: '',
  description: '',
  tripType: 'international',
  durationDays: 9,
  durationNights: 8,
  maxGroupSize: 10,
  startingPrice: 179999,
  originalPrice: 184999,
  currency: 'INR',
  datesOnRequest: false,
  departures,
  heroImage: {},
  cardImage,
  heroVideo: {},
  itinerary,
  inclusions,
  exclusions,
  importantInformation: notes,
  thingsToCarry: [],
  faqs: [],
  costing,
  reviews: [],
  featured: false,
  published: true,
  displayOrder: 0,
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
}

console.log('Creating trip...')
const doc = await Trip.create(docData)
console.log(`Created: ${doc.tripCode} ${doc.slug} ${doc._id}`)
console.log(`Destination matched: ${dest.name} (${dest._id})`)
console.log(`Final price: ${doc.startingPrice} original ${doc.originalPrice} published ${doc.published}`)

// Verify exactly one new trip was created
const countAfter = await Trip.countDocuments()
console.log(`Total trips after: ${countAfter}`)

await mongoose.disconnect()
console.log('Done')
