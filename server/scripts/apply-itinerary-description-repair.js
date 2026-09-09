#!/usr/bin/env node
/**
 * SAFE one-time migration: replace the 433 known-generic itinerary day
 * descriptions (TRP-000002 … TRP-000063) with the authored `newDescription`
 * values from rough/itinerary-description-repair.json.
 *
 * Modes (exactly one required):
 *   --dry-run   Validate everything, change NOTHING (no DB writes, no files).
 *   --apply     Validate, write a timestamped backup, then apply 433 updates.
 *   --verify    Read-only check that the repair is fully in place.
 *   --rollback  Restore original descriptions from a backup file.
 *
 * Safety: every entry is guarded by exact-match filters
 * (tripCode + current placeholder + title + trip name). Any mismatch aborts
 * the whole operation with ZERO database changes. Updates use dot-notation
 * $set on `itinerary.<index>.description` only — the itinerary array itself
 * is never replaced and no other field, image, price, date, slug, or status
 * is touched. No S3 operations anywhere in this script.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const REPAIR_PATH = path.resolve(__dirname, '../../rough/itinerary-description-repair.json');
const BACKUP_DIR = path.resolve(__dirname, '../../rough/itinerary-description-repair-backups');

const EXPECTED_ENTRIES = 433;
const EXPECTED_TRIPS = 62;

const PLACEHOLDER_MARKERS = ['Spend the day exploring', 'following the planned route'];

function usageAndExit() {
  console.log('Usage: node server/scripts/apply-itinerary-description-repair.js [--dry-run | --apply | --verify | --rollback [--backup <file>]]');
  process.exit(1);
}

function fail(message) {
  console.error(`\nFATAL: ${message}`);
  process.exit(1);
}

function loadRepairJson() {
  if (!fs.existsSync(REPAIR_PATH)) fail(`repair file not found: ${REPAIR_PATH}`);
  let entries;
  try {
    entries = JSON.parse(fs.readFileSync(REPAIR_PATH, 'utf8'));
  } catch (e) {
    fail(`repair file is not valid JSON: ${e.message}`);
  }
  if (!Array.isArray(entries)) fail('repair file must be a JSON array');
  return entries;
}

// A. Static file validations — no DB involved.
function validateRepairFile(entries) {
  const failures = [];
  if (entries.length !== EXPECTED_ENTRIES) {
    failures.push(`repair file has ${entries.length} entries, expected ${EXPECTED_ENTRIES}`);
  }
  const tripCodes = new Set(entries.map((e) => e.tripCode));
  if (tripCodes.size !== EXPECTED_TRIPS) {
    failures.push(`repair file covers ${tripCodes.size} trips, expected ${EXPECTED_TRIPS}`);
  }
  entries.forEach((e, i) => {
    if (typeof e.newDescription !== 'string' || e.newDescription.trim() === '') {
      failures.push(`entry #${i} (${e.tripCode || '?'}) has an empty newDescription`);
    }
    if (PLACEHOLDER_MARKERS.some((m) => (e.newDescription || '').includes(m))) {
      failures.push(`entry #${i} (${e.tripCode || '?'}) newDescription still contains placeholder text`);
    }
    for (const k of ['tripId', 'tripCode', 'tripName', 'slug', 'itineraryIndex', 'dayNumber', 'title', 'currentDescription']) {
      if (e[k] === undefined || e[k] === null) failures.push(`entry #${i} is missing field "${k}"`);
    }
  });
  return { failures, tripCodes };
}

async function buildTripMap(Trip) {
  const trips = await Trip.find(
    {},
    { name: 1, slug: 1, tripCode: 1, itinerary: 1 }
  ).lean();
  const map = new Map();
  for (const t of trips) map.set(t.tripCode, t);
  return map;
}

// B. Per-entry live validations against MongoDB. Pure reads.
function validateAgainstDb(entries, tripMap) {
  const stats = {
    tripsMatched: 0,
    daysMatched: 0,
    descriptionMismatches: 0,
    titleMismatches: 0,
    tripNameMismatches: 0,
    missingTrips: [],
  };
  const matchedTripCodes = new Set();
  const failures = [];

  for (const e of entries) {
    const trip = tripMap.get(e.tripCode);
    if (!trip) {
      stats.missingTrips.push(e.tripCode);
      failures.push(`trip not found: ${e.tripCode}`);
      continue;
    }
    if (trip.name !== e.tripName) {
      stats.tripNameMismatches += 1;
      failures.push(`${e.tripCode}: trip name mismatch (db ${JSON.stringify(trip.name)} vs repair ${JSON.stringify(e.tripName)})`);
      continue;
    }
    const days = Array.isArray(trip.itinerary) ? trip.itinerary : [];
    const day = days[e.itineraryIndex];
    if (!day) {
      stats.descriptionMismatches += 1;
      failures.push(`${e.tripCode} day ${e.dayNumber}: no itinerary item at index ${e.itineraryIndex}`);
      continue;
    }
    if ((day.title || '') !== (e.title || '')) {
      stats.titleMismatches += 1;
      failures.push(`${e.tripCode} day ${e.dayNumber}: title mismatch (db ${JSON.stringify(day.title)} vs repair ${JSON.stringify(e.title)})`);
      continue;
    }
    if ((day.description || '') !== (e.currentDescription || '')) {
      stats.descriptionMismatches += 1;
      failures.push(
        `${e.tripCode} day ${e.dayNumber}: description no longer matches the expected placeholder — refusing to overwrite`
      );
      continue;
    }
    matchedTripCodes.add(e.tripCode);
    stats.daysMatched += 1;
  }

  // A trip counts as matched only when every one of its repair entries matched.
  const expectedPerTrip = new Map();
  for (const e of entries) expectedPerTrip.set(e.tripCode, (expectedPerTrip.get(e.tripCode) || 0) + 1);
  const matchedPerTrip = new Map();
  for (const e of entries) {
    const trip = tripMap.get(e.tripCode);
    if (!trip) continue;
    const day = (trip.itinerary || [])[e.itineraryIndex];
    if (trip.name === e.tripName && day && (day.title || '') === (e.title || '') && (day.description || '') === (e.currentDescription || '')) {
      matchedPerTrip.set(e.tripCode, (matchedPerTrip.get(e.tripCode) || 0) + 1);
    }
  }
  stats.tripsMatched = [...expectedPerTrip.entries()].filter(([code, n]) => matchedPerTrip.get(code) === n).length;

  return { stats, failures };
}

function printDryRun(stats) {
  console.log('\n--- DRY-RUN REPORT (zero changes made) ---');
  console.log(`Trips expected: ${EXPECTED_TRIPS}`);
  console.log(`Days expected: ${EXPECTED_ENTRIES}`);
  console.log(`Trips matched: ${stats.tripsMatched}`);
  console.log(`Days matched: ${stats.daysMatched}`);
  console.log(`Description mismatches: ${stats.descriptionMismatches}`);
  console.log(`Title mismatches: ${stats.titleMismatches}`);
  console.log(`Trip-name mismatches: ${stats.tripNameMismatches}`);
  console.log(`Would update: ${stats.descriptionMismatches + stats.titleMismatches + stats.tripNameMismatches + stats.missingTrips.length === 0 ? stats.daysMatched : 0}`);
}

function timestampName() {
  const d = new Date();
  const p = (n, l = 2) => String(n).padStart(l, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}T${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}-${p(d.getMilliseconds(), 3)}Z`;
}

function writeBackup(entries) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  let backupPath = path.join(BACKUP_DIR, `itinerary-description-repair-backup-${timestampName()}.json`);
  let n = 1;
  while (fs.existsSync(backupPath)) {
    backupPath = path.join(BACKUP_DIR, `itinerary-description-repair-backup-${timestampName()}-${n}.json`);
    n += 1;
    if (n > 100) fail('could not create a non-colliding backup filename');
  }
  const backup = {
    meta: {
      createdAt: new Date().toISOString(),
      sourceRepairFile: REPAIR_PATH,
      tripCount: new Set(entries.map((e) => e.tripCode)).size,
      dayCount: entries.length,
    },
    items: entries.map((e) => ({
      tripId: e.tripId,
      tripCode: e.tripCode,
      tripName: e.tripName,
      itineraryIndex: e.itineraryIndex,
      dayNumber: e.dayNumber,
      title: e.title,
      originalDescription: e.currentDescription,
      replacementDescription: e.newDescription,
    })),
  };
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2) + '\n', 'utf8');
  return backupPath;
}

function latestBackup() {
  const idx = process.argv.indexOf('--backup');
  if (idx !== -1) {
    const p = process.argv[idx + 1];
    if (!p) fail('--backup requires a file path');
    return path.resolve(p);
  }
  if (!fs.existsSync(BACKUP_DIR)) return null;
  const files = fs.readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(BACKUP_DIR, f))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return files[0] || null;
}

async function supportsTransactions() {
  try {
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    return Boolean(hello && (hello.setName || hello.msg === 'isdbgrid'));
  } catch {
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const mode = ['--dry-run', '--apply', '--verify', '--rollback'].find((f) => args.includes(f));
  if (!mode) usageAndExit();

  console.log(`\n=== Itinerary Description Repair ${mode.toUpperCase()} ===`);

  const { default: config } = await import('../src/config/index.js');
  await mongoose.connect(config.mongoUri);
  console.log('MongoDB connected.');
  const { default: Trip } = await import('../src/models/Trip.js');

  try {
    if (mode === '--dry-run') {
      const entries = loadRepairJson();
      const { failures: fileFailures } = validateRepairFile(entries);
      if (fileFailures.length) {
        fileFailures.slice(0, 10).forEach((f) => console.error(`FILE CHECK FAILED: ${f}`));
        fail(`${fileFailures.length} repair-file validation error(s)`);
      }
      const tripMap = await buildTripMap(Trip);
      const { stats, failures } = validateAgainstDb(entries, tripMap);
      printDryRun({ ...stats, missingTrips: stats.missingTrips });
      if (failures.length) {
        failures.slice(0, 10).forEach((f) => console.error(`DB CHECK FAILED: ${f}`));
        fail(`${failures.length} live validation error(s) — would update 0 records`);
      }
      if (stats.tripsMatched !== EXPECTED_TRIPS || stats.daysMatched !== EXPECTED_ENTRIES) {
        fail(`expected ${EXPECTED_TRIPS} trips / ${EXPECTED_ENTRIES} days matched, got ${stats.tripsMatched} / ${stats.daysMatched}`);
      }
      console.log('\nDRY-RUN OK: all validations pass. No database changes, no files written.');
      return;
    }

    if (mode === '--apply') {
      const entries = loadRepairJson();
      const { failures: fileFailures } = validateRepairFile(entries);
      if (fileFailures.length) {
        fileFailures.slice(0, 10).forEach((f) => console.error(`FILE CHECK FAILED: ${f}`));
        fail(`${fileFailures.length} repair-file validation error(s) — aborting with zero changes`);
      }
      // E: validate ALL 433 records before the first update.
      let tripMap = await buildTripMap(Trip);
      let checked = validateAgainstDb(entries, tripMap);
      if (checked.failures.length || checked.stats.daysMatched !== EXPECTED_ENTRIES) {
        checked.failures.slice(0, 10).forEach((f) => console.error(`DB CHECK FAILED: ${f}`));
        fail(`pre-apply validation failed — ZERO database changes made`);
      }
      console.log(`Pre-apply validation passed: ${checked.stats.tripsMatched} trips, ${checked.stats.daysMatched} days matched, 0 mismatches.`);

      const backupPath = writeBackup(entries);
      console.log(`Backup written (never overwritten): ${backupPath}`);

      const useTx = await supportsTransactions();
      console.log(useTx
        ? 'Replica set detected — applying 433 updates inside a MongoDB transaction.'
        : 'No replica set detected — applying 433 pre-validated updates sequentially (all validations already passed).');

      let updated = 0;
      const applyAll = async (session) => {
        for (const e of entries) {
          const pathKey = `itinerary.${e.itineraryIndex}.description`;
          const res = await Trip.updateOne(
            { tripCode: e.tripCode, [pathKey]: e.currentDescription },
            { $set: { [pathKey]: e.newDescription } },
            session ? { session } : {}
          ).exec();
          if (res.matchedCount !== 1 || res.modifiedCount !== 1) {
            throw new Error(`${e.tripCode} day ${e.dayNumber}: guarded update matched ${res.matchedCount}, modified ${res.modifiedCount} — aborting`);
          }
          updated += 1;
        }
      };

      if (useTx) {
        const session = await mongoose.startSession();
        try {
          await session.withTransaction(() => applyAll(session));
        } finally {
          await session.endSession();
        }
      } else {
        await applyAll(null);
      }

      console.log('\n--- APPLY REPORT ---');
      console.log(`Descriptions updated: ${updated}`);
      console.log(`Backup file: ${backupPath}`);
      if (updated !== EXPECTED_ENTRIES) {
        fail(`updated ${updated} descriptions, expected exactly ${EXPECTED_ENTRIES} — treat as FAILED and investigate (see backup)`);
      }
      console.log('APPLY OK: exactly 433 descriptions replaced. Run --verify to confirm.');
      return;
    }

    if (mode === '--verify') {
      const entries = loadRepairJson();
      const tripMap = await buildTripMap(Trip);
      let repaired = 0;
      let stillOld = 0;
      let unexpected = 0;
      const presentCodes = new Set();
      const problems = [];
      for (const e of entries) {
        const trip = tripMap.get(e.tripCode);
        if (!trip) { problems.push(`${e.tripCode}: trip missing`); continue; }
        presentCodes.add(e.tripCode);
        const day = (trip.itinerary || [])[e.itineraryIndex];
        if (!day) { problems.push(`${e.tripCode} day ${e.dayNumber}: index missing`); unexpected += 1; continue; }
        if ((day.title || '') !== (e.title || '') || day.dayNumber !== e.dayNumber) {
          problems.push(`${e.tripCode} day ${e.dayNumber}: title/dayNumber changed unexpectedly`);
          unexpected += 1;
          continue;
        }
        if ((day.description || '') === (e.newDescription || '')) repaired += 1;
        else if ((day.description || '') === (e.currentDescription || '')) stillOld += 1;
        else { problems.push(`${e.tripCode} day ${e.dayNumber}: description is neither old nor new`); unexpected += 1; }
      }
      console.log('\n--- VERIFY REPORT (read-only) ---');
      console.log(`Repaired descriptions matching newDescription: ${repaired}`);
      console.log(`Entries still containing old placeholder: ${stillOld}`);
      console.log(`Trip codes present: ${presentCodes.size}`);
      console.log(`Unexpected field/value changes: ${unexpected}`);
      if (problems.length) problems.slice(0, 10).forEach((p) => console.error(`VERIFY PROBLEM: ${p}`));
      if (repaired !== EXPECTED_ENTRIES || stillOld !== 0 || presentCodes.size !== EXPECTED_TRIPS || unexpected !== 0) {
        fail('verification FAILED — see problems above');
      }
      console.log('VERIFY OK: all 433 repaired, 0 placeholders remain, 62 trips present, no unexpected changes.');
      return;
    }

    if (mode === '--rollback') {
      const backupPath = latestBackup();
      if (!backupPath || !fs.existsSync(backupPath)) {
        fail(`no backup file found in ${BACKUP_DIR} (pass --backup <file> to specify one)`);
      }
      console.log(`Using backup: ${backupPath}`);
      const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      const items = backup.items || [];
      if (!items.length) fail('backup file contains no items');
      const tripMap = await buildTripMap(Trip);
      // Pre-verify every entry BEFORE restoring anything.
      for (const b of items) {
        const trip = tripMap.get(b.tripCode);
        if (!trip) fail(`rollback aborted: trip missing ${b.tripCode} — ZERO changes made`);
        const day = (trip.itinerary || [])[b.itineraryIndex];
        if (!day) fail(`rollback aborted: index ${b.itineraryIndex} missing on ${b.tripCode} — ZERO changes made`);
        if ((day.description || '') !== (b.replacementDescription || '')) {
          fail(`rollback aborted: ${b.tripCode} day ${b.dayNumber} no longer holds the replacement text (changed since apply?) — ZERO changes made, not overwriting`);
        }
      }
      console.log(`Pre-rollback verification passed for ${items.length} entries. Restoring originals…`);
      const useTx = await supportsTransactions();
      let restored = 0;
      const doAll = async (session) => {
        for (const b of items) {
          const pathKey = `itinerary.${b.itineraryIndex}.description`;
          const res = await Trip.updateOne(
            { tripCode: b.tripCode, [pathKey]: b.replacementDescription },
            { $set: { [pathKey]: b.originalDescription } },
            session ? { session } : {}
          ).exec();
          if (res.matchedCount !== 1 || res.modifiedCount !== 1) {
            throw new Error(`${b.tripCode} day ${b.dayNumber}: restore matched ${res.matchedCount}, modified ${res.modifiedCount} — aborting`);
          }
          restored += 1;
        }
      };
      if (useTx) {
        const session = await mongoose.startSession();
        try {
          await session.withTransaction(() => doAll(session));
        } finally {
          await session.endSession();
        }
      } else {
        await doAll(null);
      }
      console.log('\n--- ROLLBACK REPORT ---');
      console.log(`Descriptions restored: ${restored} of ${items.length}`);
      if (restored !== items.length) fail('rollback incomplete — investigate immediately');
      console.log('ROLLBACK OK.');
      return;
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(async (err) => {
  console.error('Fatal error', err && err.message ? err.message : err);
  try { await mongoose.disconnect(); } catch {}
  process.exit(1);
});
