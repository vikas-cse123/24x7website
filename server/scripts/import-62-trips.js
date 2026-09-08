#!/usr/bin/env node
/**
 * One-time import for 62 trips into existing 24x7Chhutti DB.
 * Dry-run by default. Use --execute to actually insert.
 * No S3 operations, no destination/trip modifications.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const JSON_PATH = path.resolve(__dirname, '../../rough/24x7chhutti_62_trip_import_ready.json');
const DRY_RUN = !process.argv.includes('--execute');

async function main() {
  const raw = fs.readFileSync(JSON_PATH, 'utf8');
  const records = JSON.parse(raw);
  console.log(`\n=== 24x7Chhutti 62-Trip Import ${DRY_RUN ? '(DRY RUN)' : '(EXECUTE)'} ===`);
  console.log(`JSON records found: ${records.length}`);

  // Dynamic imports after dotenv so config picks up env
  const { default: config } = await import('../src/config/index.js');
  await mongoose.connect(config.mongoUri);
  console.log(`MongoDB connected: ${config.mongoUri.split('@').pop()?.split('?')[0] || 'unknown'}`);

  const { default: Destination } = await import('../src/models/Destination.js');
  const { default: Trip } = await import('../src/models/Trip.js');

  const destinations = await Destination.find({}).lean();
  console.log(`Destinations found: ${destinations.length}`);
  destinations.forEach(d => {
    // console.log(` - ${d.name} | ${d.slug} | ${d._id}`);
  });

  // Build destinationName -> destination map (normalized)
  function normalize(str) {
    return String(str).toLowerCase().replace(/tour packages/g, '').replace(/[^a-z0-9]/g, '').trim();
  }
  const destByNorm = new Map();
  const destBySlug = new Map();
  const destByNameLower = new Map();
  for (const d of destinations) {
    destByNorm.set(normalize(d.name), d);
    destByNorm.set(normalize(d.slug), d);
    destBySlug.set(d.slug, d);
    destByNameLower.set(d.name.toLowerCase(), d);
  }

  // Also check unique JSON destinationNames
  const jsonDestNames = [...new Set(records.map(r => r.destinationName))];
  console.log(`Distinct destinationNames in JSON: ${jsonDestNames.length}`);
  console.log(jsonDestNames.join(', '));

  let destinationsMissing = [];
  let destinationsFoundSet = new Set();
  const mappedRecords = [];
  for (const rec of records) {
    const keyNorm = normalize(rec.destinationName);
    let dest = destByNorm.get(keyNorm);
    if (!dest) {
      // fallback: includes search
      const lower = rec.destinationName.toLowerCase();
      dest = destinations.find(d => d.name.toLowerCase().includes(lower) || d.slug.toLowerCase().includes(lower.replace(/\s+/g, '-')));
    }
    if (!dest) {
      destinationsMissing.push(rec.destinationName);
    } else {
      destinationsFoundSet.add(dest.name);
    }
    mappedRecords.push({ rec, dest });
  }
  const uniqueMissing = [...new Set(destinationsMissing)];
  console.log(`Destinations matched: ${destinationsFoundSet.size} / 31`);
  if (uniqueMissing.length) {
    console.log(`Destinations missing (${uniqueMissing.length}): ${uniqueMissing.join(', ')}`);
  } else {
    console.log(`Destinations missing: 0`);
  }

  // TripCode generation - find highest existing
  const existingTrips = await Trip.find({}, { tripCode: 1, slug: 1, name: 1, destinationId: 1 }).lean();
  console.log(`Existing trips in DB before import: ${existingTrips.length}`);
  existingTrips.forEach(t => console.log(` - ${t.tripCode} | ${t.slug} | ${t.name}`));

  let maxNum = 0;
  for (const t of existingTrips) {
    const m = /^TRP-(\d+)$/.exec(t.tripCode);
    if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
  }
  const nextCodeNum = maxNum + 1;
  console.log(`Highest existing tripCode number: ${maxNum} (${maxNum ? `TRP-${String(maxNum).padStart(6,'0')}` : 'none'})`);
  console.log(`Next available tripCode: TRP-${String(nextCodeNum).padStart(6,'0')}`);
  const codes = [];
  for (let i = 0; i < records.length; i++) {
    codes.push(`TRP-${String(nextCodeNum + i).padStart(6,'0')}`);
  }
  console.log(`TripCode range for 62 records: ${codes[0]} → ${codes[codes.length-1]}`);

  // Ensure slugs are unique across JSON and against existing DB (intra-JSON deduplication)
  const seenSlugs = new Set(existingTrips.map(t => t.slug));
  for (const rec of records) {
    let base = rec.slug;
    let slug = base;
    let counter = 2;
    while (seenSlugs.has(slug)) {
      slug = `${base}-${counter}`;
      counter++;
    }
    if (slug !== rec.slug) {
      console.log(` - Deduped slug: "${rec.slug}" → "${slug}" for ${rec.name}`);
      rec.slug = slug;
    }
    seenSlugs.add(slug);
  }

  // Duplicate protection checks
  const existingBySlug = new Set(existingTrips.map(t => t.slug));
  const existingByTripCode = new Set(existingTrips.map(t => t.tripCode));
  const existingByDestName = new Set(existingTrips.map(t => `${t.destinationId.toString()}__${String(t.name).toLowerCase().trim()}`));

  let duplicates = [];
  let validRecords = [];
  let invalidRecords = [];
  let readyForInsertion = [];

  // Prepare validation helper - we will use mongoose validation via Trip model, but also check required
  for (let idx = 0; idx < mappedRecords.length; idx++) {
    const { rec, dest } = mappedRecords[idx];
    const slug = rec.slug;
    const nameNorm = String(rec.name).toLowerCase().trim();
    const destIdStr = dest ? dest._id.toString() : 'missing';
    const isDuplicate =
      existingBySlug.has(slug) ||
      existingByDestName.has(`${destIdStr}__${nameNorm}`);

    // also check intra-JSON duplicates
    const intraSlugDup = records.filter((r, j) => j !== idx && r.slug === slug).length > 0;
    const intraNameDup = records.filter((r, j) => j !== idx && r.destinationName === rec.destinationName && String(r.name).toLowerCase().trim() === nameNorm).length > 0;

    const reasons = [];
    if (!dest) reasons.push('missing destination');
    if (existingBySlug.has(slug)) reasons.push('duplicate slug');
    if (existingByDestName.has(`${destIdStr}__${nameNorm}`)) reasons.push('duplicate destination+name');
    if (intraSlugDup) reasons.push('intra-JSON slug duplicate');
    // Basic validation
    if (!rec.name || !rec.slug || !rec.destinationName) reasons.push('missing required name/slug/destination');
    if (!rec.tripType || !['group','customized','honeymoon','family','adventure','weekend','international','domestic'].includes(rec.tripType)) reasons.push('invalid tripType');
    if (!rec.durationDays || rec.durationDays < 1) reasons.push('invalid durationDays');
    if (rec.startingPrice == null || typeof rec.startingPrice !== 'number' || rec.startingPrice < 0) reasons.push('invalid startingPrice');

    // Check destination image available
    if (dest && !dest.homepageImage?.url && !dest.homepageImage?.publicId) {
      // not invalid, but warn
      // reasons.push('destination homepageImage missing');
    }

    if (reasons.length === 0) {
      validRecords.push({ idx, rec, dest, assignedCode: codes[idx] });
      if (!isDuplicate) {
        readyForInsertion.push({ idx, rec, dest, assignedCode: codes[idx] });
      } else {
        duplicates.push({ idx, slug, name: rec.name, destinationName: rec.destinationName, reasons });
      }
    } else {
      if (isDuplicate) {
        duplicates.push({ idx, slug, name: rec.name, destinationName: rec.destinationName, reasons });
      } else {
        invalidRecords.push({ idx, slug, name: rec.name, destinationName: rec.destinationName, reasons });
      }
    }
  }

  // Also check if any of the readyForInsertion would still collide with each other (intra-JSON)
  const intraReadySlugs = new Map();
  const filteredReady = [];
  const intraDupsFiltered = [];
  for (const item of readyForInsertion) {
    if (intraReadySlugs.has(item.rec.slug)) {
      intraDupsFiltered.push(item);
    } else {
      intraReadySlugs.set(item.rec.slug, true);
      filteredReady.push(item);
    }
  }
  if (intraDupsFiltered.length) {
    console.log(`Intra-JSON duplicate slugs among ready records: ${intraDupsFiltered.length}`);
    intraDupsFiltered.forEach(d => console.log(` - ${d.rec.slug}`));
  }
  readyForInsertion = filteredReady;

  console.log(`\n--- Duplicate Protection ---`);
  console.log(`Existing duplicates (skipped): ${duplicates.length}`);
  duplicates.forEach(d => console.log(` - [${d.idx}] ${d.slug} | ${d.name} | ${d.destinationName} | reasons: ${d.reasons.join(', ')}`));
  console.log(`Valid records: ${validRecords.length}`);
  console.log(`Invalid records: ${invalidRecords.length}`);
  invalidRecords.forEach(d => console.log(` - [${d.idx}] ${d.slug} | ${d.name} | reasons: ${d.reasons.join(', ')}`));
  console.log(`Records ready for insertion (after duplicate filter): ${readyForInsertion.length}`);

  // Show next codes for ready
  if (readyForInsertion.length) {
    console.log(`\nFirst 5 ready records with assigned codes:`);
    readyForInsertion.slice(0,5).forEach(r => console.log(` - ${r.assignedCode} | ${r.rec.slug} | ${r.rec.name} | dest: ${r.dest.name} (${r.dest._id})`));
    console.log(`Last 5:`);
    readyForInsertion.slice(-5).forEach(r => console.log(` - ${r.assignedCode} | ${r.rec.slug} | ${r.rec.name}`));
  }

  // Preview transformed document for first record
  if (readyForInsertion.length) {
    const sample = readyForInsertion[0];
    const dest = sample.dest;
    const rec = sample.rec;
    const cardImage = dest.homepageImage && (dest.homepageImage.url || dest.homepageImage.publicId) ? dest.homepageImage : {};
    const seoKeywordsStr = Array.isArray(rec.seoKeywords) ? rec.seoKeywords.join(', ') : String(rec.seoKeywords || '');
    const transformed = {
      destinationId: dest._id,
      name: rec.name,
      cardName: rec.cardName || rec.name,
      pageHeading: rec.pageHeading || rec.name,
      slug: rec.slug,
      tripCode: sample.assignedCode,
      shortDescription: rec.shortDescription || '',
      description: rec.description || '',
      tripType: rec.tripType || 'group',
      durationDays: rec.durationDays,
      durationNights: rec.durationNights,
      maxGroupSize: rec.maxGroupSize && rec.maxGroupSize > 0 ? rec.maxGroupSize : 10,
      startingPrice: rec.startingPrice,
      originalPrice: null,
      currency: rec.currency || 'INR',
      datesOnRequest: true,
      departures: [],
      heroImage: {},
      cardImage: cardImage,
      heroVideo: {},
      gallery: [],
      itinerary: rec.itinerary || [],
      inclusions: rec.inclusions || [],
      exclusions: rec.exclusions || [],
      importantInformation: rec.importantInformation || '',
      thingsToCarry: rec.thingsToCarry || [],
      faqs: rec.faqs || [],
      costing: rec.costing || [],
      reviews: [],
      featured: false,
      published: false,
      displayOrder: rec.displayOrder || 0,
      seoTitle: rec.seoTitle || '',
      seoDescription: rec.seoDescription || '',
      seoKeywords: seoKeywordsStr,
    };
    console.log(`\nSample transformed document (first ready):`);
    console.log(JSON.stringify(transformed, null, 2).slice(0, 3000) + (JSON.stringify(transformed).length > 3000 ? '...' : ''));
  }

  if (DRY_RUN) {
    console.log(`\n=== DRY RUN COMPLETE — No records inserted ===`);
    console.log(`To execute, run: node server/scripts/import-62-trips.js --execute`);
  } else {
    console.log(`\n=== EXECUTING IMPORT ===`);
    let created = 0;
    let skipped = duplicates.length + invalidRecords.length;
    let errors = [];
    const createdIds = [];
    const assignedCodes = [];
    const totalBefore = await Trip.countDocuments();
    for (const item of readyForInsertion) {
      const rec = item.rec;
      const dest = item.dest;
      const cardImage = dest.homepageImage && (dest.homepageImage.url || dest.homepageImage.publicId) ? dest.homepageImage : {};
      const seoKeywordsStr = Array.isArray(rec.seoKeywords) ? rec.seoKeywords.join(', ') : String(rec.seoKeywords || '');
      const docData = {
        destinationId: dest._id,
        name: rec.name,
        cardName: rec.cardName || rec.name,
        pageHeading: rec.pageHeading || rec.name,
        slug: rec.slug,
        tripCode: item.assignedCode,
        shortDescription: rec.shortDescription || '',
        description: rec.description || '',
        tripType: rec.tripType || 'group',
        durationDays: rec.durationDays,
        durationNights: rec.durationNights,
        maxGroupSize: rec.maxGroupSize && rec.maxGroupSize > 0 ? rec.maxGroupSize : 10,
        startingPrice: rec.startingPrice,
        originalPrice: null,
        currency: rec.currency || 'INR',
        datesOnRequest: true,
        departures: [],
        heroImage: {},
        cardImage: cardImage,
        heroVideo: {},
        gallery: [],
        itinerary: rec.itinerary || [],
        inclusions: rec.inclusions || [],
        exclusions: rec.exclusions || [],
        importantInformation: rec.importantInformation || '',
        thingsToCarry: rec.thingsToCarry || [],
        faqs: rec.faqs || [],
        costing: rec.costing || [],
        reviews: [],
        featured: false,
        published: false,
        displayOrder: rec.displayOrder || 0,
        seoTitle: rec.seoTitle || '',
        seoDescription: rec.seoDescription || '',
        seoKeywords: seoKeywordsStr,
      };
      try {
        const doc = await Trip.create(docData);
        created++;
        createdIds.push(doc._id.toString());
        assignedCodes.push(doc.tripCode);
        console.log(`Created ${doc.tripCode} | ${doc.slug} | ${doc._id}`);
      } catch (e) {
        console.error(`Failed ${rec.slug}: ${e.message}`);
        if (e.errors) console.error(JSON.stringify(e.errors, null, 2).slice(0,2000));
        errors.push({ slug: rec.slug, error: e.message });
      }
    }
    const totalAfter = await Trip.countDocuments();
    console.log(`\n=== IMPORT COMPLETE ===`);
    console.log(`Total JSON records: ${records.length}`);
    console.log(`Trips created: ${created}`);
    console.log(`Trips skipped: ${skipped}`);
    console.log(`Duplicates prevented: ${duplicates.length}`);
    console.log(`Missing destinations: ${uniqueMissing.length}`);
    console.log(`Validation failures: ${invalidRecords.length}`);
    console.log(`Database errors: ${errors.length}`);
    console.log(`Assigned tripCodes: ${assignedCodes.join(', ')}`);
    console.log(`MongoDB IDs: ${createdIds.join(', ')}`);
    console.log(`Total trips before: ${totalBefore}, after: ${totalAfter}`);
    if (errors.length) {
      console.log(`Errors:`);
      errors.forEach(err => console.log(` - ${err.slug}: ${err.error}`));
    }
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch(err => {
  console.error('Fatal error', err);
  process.exit(1);
});
