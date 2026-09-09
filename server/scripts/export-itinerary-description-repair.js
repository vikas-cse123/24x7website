#!/usr/bin/env node
/**
 * One-time DATA PREPARATION export: extract the 433 known-generic itinerary
 * day descriptions (TRP-000002 … TRP-000063) into a repair JSON file whose
 * `newDescription` fields can later be filled with real content.
 *
 * READ-ONLY against MongoDB in every mode. This script never inserts,
 * updates, or deletes any document. It only writes one local JSON file
 * (export mode).
 *
 *   node server/scripts/export-itinerary-description-repair.js          # export
 *   node server/scripts/export-itinerary-description-repair.js --verify # read-only re-check
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Expected audit baselines (from the read-only investigation). Actuals are
// always calculated live from MongoDB; any deviation fails loudly.
const EXPECTED_AFFECTED_TRIPS = 62;
const EXPECTED_AFFECTED_DAYS = 433;

const OUTPUT_PATH = path.resolve(__dirname, '../../rough/itinerary-description-repair.json');

// The known generic placeholder pattern. Both markers are required so that
// real or empty descriptions can never be picked up.
function isGenericDescription(value) {
  if (typeof value !== 'string') return false;
  if (value.trim() === '') return false;
  return value.includes('Spend the day exploring') && value.includes('following the planned route');
}

function fail(message) {
  console.error(`\nFATAL: ${message}`);
  return 1;
}

async function collectAffected(Trip) {
  const { default: Destination } = await import('../src/models/Destination.js');
  const destinations = await Destination.find({}, { name: 1, slug: 1 }).lean();
  const destNameById = new Map(destinations.map((d) => [String(d._id), d.name || '']));

  const trips = await Trip.find({}, { name: 1, slug: 1, tripCode: 1, itinerary: 1, destinationId: 1 })
    .sort({ tripCode: 1 })
    .lean();

  const entries = [];
  const perTripCounts = new Map();
  for (const trip of trips) {
    const itinerary = Array.isArray(trip.itinerary) ? trip.itinerary : [];
    const destName = destNameById.get(String(trip.destinationId)) || '';
    itinerary.forEach((day, itineraryIndex) => {
      const currentDescription = day && typeof day.description === 'string' ? day.description : '';
      if (!isGenericDescription(currentDescription)) return;
      entries.push({
        tripId: String(trip._id),
        tripCode: trip.tripCode,
        tripName: trip.name,
        destination: destName,
        slug: trip.slug,
        itineraryIndex,
        dayNumber: day.dayNumber,
        title: day.title || '',
        currentDescription,
        newDescription: '',
      });
      perTripCounts.set(trip.tripCode, (perTripCounts.get(trip.tripCode) || 0) + 1);
    });
  }

  // Deterministic order: tripCode ASC → itineraryIndex ASC.
  entries.sort((a, b) => {
    if (a.tripCode < b.tripCode) return -1;
    if (a.tripCode > b.tripCode) return 1;
    return a.itineraryIndex - b.itineraryIndex;
  });

  return { entries, perTripCounts };
}

// Shared loud validations. Returns an array of failure messages (empty = pass).
function validateExport(entries, perTripCounts) {
  const failures = [];
  const tripCodes = [...perTripCounts.keys()];

  if (tripCodes.length !== EXPECTED_AFFECTED_TRIPS) {
    failures.push(
      `affected-trip count is ${tripCodes.length}, expected ${EXPECTED_AFFECTED_TRIPS} (audit drift — investigate before proceeding)`
    );
  }
  if (entries.length !== EXPECTED_AFFECTED_DAYS) {
    failures.push(
      `affected-day count is ${entries.length}, expected ${EXPECTED_AFFECTED_DAYS} (audit drift — investigate before proceeding)`
    );
  }
  if (tripCodes.includes('TRP-000001')) {
    failures.push('TRP-000001 (known-valid trip) is included — must be excluded');
  }
  if (tripCodes.includes('TRP-000064')) {
    failures.push('TRP-000064 is included but has no generic descriptions — must be excluded');
  }
  for (const e of entries) {
    if (!isGenericDescription(e.currentDescription)) {
      failures.push(`non-generic description exported for ${e.tripCode} day ${e.dayNumber} — only placeholders may be exported`);
      break;
    }
    if (e.newDescription !== '') {
      failures.push(`newDescription must be empty (found content for ${e.tripCode} day ${e.dayNumber})`);
      break;
    }
  }
  return failures;
}

function printSummary(entries, perTripCounts) {
  const counts = [...perTripCounts.values()];
  const min = counts.length ? Math.min(...counts) : 0;
  const max = counts.length ? Math.max(...counts) : 0;
  console.log('\n--- AUDIT SUMMARY ---');
  console.log(`Total affected trips: ${perTripCounts.size}`);
  console.log(`Total affected itinerary days: ${entries.length}`);
  console.log(`Minimum days per trip: ${min}`);
  console.log(`Maximum days per trip: ${max}`);
  console.log(`Number of trips exported: ${perTripCounts.size}`);
  console.log(`Number of itinerary days exported: ${entries.length}`);
}

async function main() {
  const VERIFY_ONLY = process.argv.includes('--verify');
  console.log(`\n=== Itinerary Description Repair Export ${VERIFY_ONLY ? '(VERIFY — read-only)' : '(EXPORT — MongoDB read-only)'} ===`);

  const { default: config } = await import('../src/config/index.js');
  await mongoose.connect(config.mongoUri);
  console.log('MongoDB connected (reads only; no writes will be performed).');

  const { default: Trip } = await import('../src/models/Trip.js');

  const { entries, perTripCounts } = await collectAffected(Trip);
  const failures = validateExport(entries, perTripCounts);
  printSummary(entries, perTripCounts);

  if (failures.length > 0) {
    await mongoose.disconnect();
    failures.forEach((f) => console.error(`CHECK FAILED: ${f}`));
    process.exit(fail(failures.join('; ')));
  }
  console.log('\nAll checks passed:');
  console.log('- TRP-000001 NOT included');
  console.log('- TRP-000064 NOT included (no generic descriptions)');
  console.log('- No real descriptions included');
  console.log('- No empty descriptions included');
  console.log('- Only known generic placeholder descriptions exported');

  if (VERIFY_ONLY) {
    console.log('\n=== VERIFY COMPLETE — MongoDB untouched, no files written ===');
    await mongoose.disconnect();
    return;
  }

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(entries, null, 2) + '\n', 'utf8');
  console.log(`\nRepair file written: ${OUTPUT_PATH}`);
  console.log(`Entries: ${entries.length} (newDescription left empty for later authoring)`);
  console.log('\n=== EXPORT COMPLETE — MongoDB untouched, no trip data changed ===');
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Fatal error', err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
