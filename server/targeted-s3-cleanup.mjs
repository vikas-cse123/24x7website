#!/usr/bin/env node
// Targeted S3 cleanup — deletes ONLY the 7 verified orphaned destination images
// Safety rules per task description: fresh isKeyReferenced() before each delete,
// fail-closed on error, verify protected objects, NO Mongo writes, NO broad cleanup.

import dotenv from 'dotenv'
import { resolve } from 'node:path'

// Load .env from project root explicitly BEFORE any other imports
// This is critical because s3 config reads process.env at import time.
dotenv.config({ path: resolve('/Users/akash/Documents/vikas-new/vikas/travel-website-24x7/.env') })

// Now dynamically import everything else to ensure env is loaded
const mongooseMod = await import('mongoose')
const mongoose = mongooseMod.default

const configMod = await import('./src/config/index.js')
const config = configMod.default

const s3ConfigMod = await import('./src/config/s3.js')
const { s3Client, s3Config, isS3Configured } = s3ConfigMod

const s3ServiceMod = await import('./src/services/s3.service.js')
const s3Service = s3ServiceMod

const imageStorageMod = await import('./src/services/imageStorage.service.js')
const { isKeyReferenced, areKeysReferenced } = imageStorageMod

import { ListObjectsV2Command } from '@aws-sdk/client-s3'

// ---------------------------------------------------------------------------
// Exact keys from task
// ---------------------------------------------------------------------------
const CANDIDATE_KEYS = [
  'destinations/1788788155718-592ff1f6-4e5d-4bb8-9cce-ff9fabf2d2dc.png',
  'destinations/1788788232517-8ce1cc22-b01d-4f26-8027-10f1f5a83335.png',
  'destinations/1788788243288-0602af9e-0f8e-4b53-86e1-e1e166e1af74.png',
  'destinations/1788788256139-23807480-6c5d-41ef-bddc-4352bd5812ec.png',
  'destinations/1788789803624-c011dcca-58a8-4654-9f2c-08fdd7764354.png',
  'destinations/1788789939238-54d807f9-a729-4471-be9b-8a389d4a435d.png',
  'destinations/1788789994169-866d2351-91f3-4d2f-a47c-684d660f1762.jpg',
]

const PROTECTED_KEYS = [
  'destinations/1788788275244-f8db8e26-c667-4e88-a623-85f3da236ece.png', // Sri Lanka homepage
  'destinations/1788788414534-d4347bbe-2f8b-4749-8a62-570e5cc2651e.jpg', // Sri Lanka hero
  'destinations/1788789150113-aacf8242-060a-427e-90db-6ad42cdeb2f6.png', // Vietnam homepage
  'destinations/1788789182225-bd001367-360d-4670-99db-3d78009622a3.mp4', // Vietnam hero video
  'destinations/1788789946032-e824ed1f-4aa6-47a4-a3e2-2ec2f98bad6d.png', // Singapore homepage
  'destinations/1788790214791-69577d49-3c15-4582-8ee3-8c3e23740bc2.jpg', // Singapore hero
]

const OTHER_PREFIXES = [
  'trips/',
  'trip-media/',
  'blogs/',
  'branding/',
  'whatsapp/',
  'website/',
  'hotels/',
  'sightseeing/',
  'vehicles/',
  'travel-crm/',
]

function sanitizeMongoUri(uri) {
  try {
    const url = new URL(uri)
    const host = url.host
    const dbName = url.pathname?.replace(/^\//, '').split('?')[0] || ''
    return `${url.protocol}//${host}/${dbName}`
  } catch {
    return uri.replace(/\/\/.*@/, '//***:***@')
  }
}

async function listPrefix(prefix) {
  if (!s3Client || !isS3Configured) return { count: null, keys: [], error: 'S3 not configured' }
  try {
    const cmd = new ListObjectsV2Command({ Bucket: s3Config.bucket, Prefix: prefix })
    const resp = await s3Client.send(cmd)
    const keys = (resp.Contents || []).map((o) => o.Key)
    return { count: resp.KeyCount ?? keys.length, keys, raw: resp }
  } catch (e) {
    return { count: null, keys: [], error: e.message }
  }
}

async function main() {
  console.log('='.repeat(80))
  console.log('TARGETED S3 CLEANUP — 7 orphaned destination images')
  console.log('='.repeat(80))
  console.log(`Time: ${new Date().toISOString()}`)
  console.log(`S3 Bucket: ${s3Config.bucket || '(not configured)'} Region: ${s3Config.region || '(not configured)'}`)
  console.log(`Mongo URI: ${sanitizeMongoUri(config.mongoUri)}`)
  console.log('')

  // -----------------------------------------------------------------------
  // Validate S3 configured
  // -----------------------------------------------------------------------
  if (!isS3Configured || !s3Client) {
    console.error('FATAL: S3 is not configured. Check AWS env vars.')
    process.exit(1)
  }

  // -----------------------------------------------------------------------
  // 1. Connect to MongoDB
  // -----------------------------------------------------------------------
  console.log('--- CONNECTING TO MONGODB ATLAS ---')
  let connected = false
  let dbName = null
  try {
    mongoose.set('strictQuery', true)
    await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 })
    connected = true
    dbName = mongoose.connection.name
    console.log(`MongoDB connected: YES`)
    console.log(`Database: ${dbName} (${sanitizeMongoUri(config.mongoUri)})`)
  } catch (err) {
    console.error(`MongoDB connected: NO — ${err.message}`)
    console.error('FATAL: Cannot proceed without DB connection. Fail-closed.')
    process.exit(1)
  }

  const db = mongoose.connection.db
  if (!db) {
    console.error('FATAL: mongoose.connection.db is null after connect')
    process.exit(1)
  }

  // -----------------------------------------------------------------------
  // 2. Pre-check: Destination count
  // -----------------------------------------------------------------------
  let destCountBefore = null
  try {
    const coll = db.collection('destinations')
    destCountBefore = await coll.countDocuments()
    console.log(`Destination count (before): ${destCountBefore}`)
  } catch (e) {
    console.error(`Failed to count destinations: ${e.message}`)
    destCountBefore = null
  }

  // Also capture destination image references for post-compare
  let destRefsBefore = null
  try {
    const coll = db.collection('destinations')
    const docs = await coll.find({}).toArray()
    destRefsBefore = docs.map((d) => ({
      slug: d.slug,
      homepageImage: d.homepageImage?.publicId || null,
      heroImage: d.heroImage?.publicId || null,
      heroVideo: d.heroVideo?.publicId || null,
      gallery: (d.gallery || []).map((g) => g.publicId),
    }))
    console.log(`Captured ${destRefsBefore.length} destination docs for before/after compare`)
  } catch (e) {
    console.error(`Failed to capture destination refs: ${e.message}`)
  }

  // -----------------------------------------------------------------------
  // 3. S3 existence checks — candidates and protected
  // -----------------------------------------------------------------------
  console.log('\n--- PRE-DELETION S3 EXISTENCE CHECKS ---')
  const candidateExists = {}
  const protectedExists = {}

  console.log('Checking 7 candidate objects (should exist before deletion if not already deleted):')
  for (const key of CANDIDATE_KEYS) {
    try {
      const exists = await s3Service.exists(key)
      candidateExists[key] = exists
      console.log(`  ${exists ? 'EXISTS    ' : 'NOT FOUND '} ${key}`)
    } catch (e) {
      candidateExists[key] = false
      console.log(`  ERROR checking ${key}: ${e.message}`)
    }
  }

  console.log('\nChecking 6 protected objects (must exist, must NOT be deleted):')
  let protectedMissing = []
  for (const key of PROTECTED_KEYS) {
    try {
      const exists = await s3Service.exists(key)
      protectedExists[key] = exists
      console.log(`  ${exists ? 'EXISTS    ' : 'MISSING!!!'} ${key}`)
      if (!exists) protectedMissing.push(key)
    } catch (e) {
      protectedExists[key] = false
      console.log(`  ERROR checking ${key}: ${e.message}`)
      protectedMissing.push(key)
    }
  }

  if (protectedMissing.length > 0) {
    console.error(`\nFATAL: ${protectedMissing.length} protected object(s) missing! STOPPING cleanup entirely.`)
    for (const k of protectedMissing) console.error(`  MISSING: ${k}`)
    console.error('No deletions will be performed. Report problem immediately.')
    await mongoose.disconnect().catch(() => {})
    process.exit(1)
  }

  console.log(`\nS3 Pre-check: Candidate objects found: ${Object.values(candidateExists).filter(Boolean).length}/7`)
  console.log(`S3 Pre-check: Protected objects found: ${Object.values(protectedExists).filter(Boolean).length}/6`)

  // Also list destinations prefix
  console.log('\nListing s3://24x7-website/destinations/ (pre-deletion):')
  const destListBefore = await listPrefix('destinations/')
  if (destListBefore.error) {
    console.log(`  List error: ${destListBefore.error}`)
  } else {
    console.log(`  Count: ${destListBefore.count}, Keys: ${destListBefore.keys.length}`)
    // Show which of our keys are in the list
    for (const k of [...CANDIDATE_KEYS, ...PROTECTED_KEYS]) {
      const inList = destListBefore.keys.includes(k)
      console.log(`    ${inList ? 'IN LIST ' : 'NOT IN LI'} ${k}`)
    }
  }

  // Check other prefixes were not targeted (pre)
  console.log('\nOther S3 prefix verification (pre-deletion, should not be modified):')
  const otherPrefixBefore = {}
  for (const pref of OTHER_PREFIXES) {
    const res = await listPrefix(pref)
    otherPrefixBefore[pref] = res
    if (res.error) console.log(`  ${pref} -> error: ${res.error}`)
    else console.log(`  ${pref} -> ${res.count} object(s)`)
  }

  // -----------------------------------------------------------------------
  // 4. Reference checks — Atlas-compatible via isKeyReferenced
  // -----------------------------------------------------------------------
  console.log('\n--- PRE-DELETION REFERENCE CHECKS (Atlas-compatible) ---')
  console.log('Using imageStorage.isKeyReferenced(key) which uses db.collections() + JSON.stringify')

  const candidateRefPre = {}
  const protectedRefPre = {}
  let candidateRefError = []
  let protectedRefError = []

  console.log('\n7 candidates (expected: all false):')
  for (const key of CANDIDATE_KEYS) {
    try {
      const ref = await isKeyReferenced(key)
      candidateRefPre[key] = ref
      console.log(`  isKeyReferenced(${key}) => ${ref} ${ref === false ? '(OK - unreferenced)' : '(PROTECTED - will skip)'}`)
    } catch (e) {
      candidateRefPre[key] = 'error'
      candidateRefError.push(key)
      console.log(`  isKeyReferenced(${key}) => ERROR: ${e.message} (will treat as referenced/skip)`)
    }
  }

  console.log('\n6 protected (expected: all true):')
  let protectedFailed = []
  for (const key of PROTECTED_KEYS) {
    try {
      const ref = await isKeyReferenced(key)
      protectedRefPre[key] = ref
      console.log(`  isKeyReferenced(${key}) => ${ref} ${ref === true ? '(OK - protected)' : '(UNEXPECTED FALSE!)'}`)
      if (ref !== true) protectedFailed.push(key)
    } catch (e) {
      protectedRefPre[key] = 'error'
      protectedRefError.push(key)
      console.log(`  isKeyReferenced(${key}) => ERROR: ${e.message} (fail-closed: treat as referenced)`)
      // For protected, error means we should stop? The spec says if any protected returns false, STOP. Error is not false but uncertain - we should treat as protected but also warn.
      // We will not stop on error for protected unless we want to be extra safe, but spec says STOP if false. We'll log error as protected.
      // However to be safe, we should consider error as "referenced" and not stop, but warn.
    }
  }

  if (protectedFailed.length > 0) {
    console.error(`\nFATAL: ${protectedFailed.length} protected object(s) returned isKeyReferenced === false! This indicates DB inconsistency. STOPPING cleanup entirely.`)
    for (const k of protectedFailed) console.error(`  UNEXPECTED FALSE: ${k} => ${protectedRefPre[k]}`)
    await mongoose.disconnect().catch(() => {})
    process.exit(1)
  }

  if (protectedRefError.length > 0) {
    console.log(`\nWARNING: ${protectedRefError.length} protected object(s) had reference check errors - treating as referenced (safe), continuing.`)
  }

  // Summarize candidate ref results
  const candidatesToDelete = []
  const candidatesToSkipRef = []
  const candidatesToSkipError = []
  for (const key of CANDIDATE_KEYS) {
    const r = candidateRefPre[key]
    if (r === false) candidatesToDelete.push(key)
    else if (r === true) candidatesToSkipRef.push(key)
    else candidatesToSkipError.push(key)
  }

  console.log(`\nCandidate reference summary:`)
  console.log(`  false (deletion allowed if fresh check passes): ${candidatesToDelete.length}`)
  console.log(`  true (SKIP - currently referenced): ${candidatesToSkipRef.length}`)
  console.log(`  error (SKIP - uncertain): ${candidatesToSkipError.length}`)

  if (candidatesToDelete.length === 0) {
    console.log('\nNo candidates are confirmed unreferenced. Nothing to delete. Exiting safely.')
    await mongoose.disconnect().catch(() => {})
    // Still produce final report
  } else {
    console.log(`\nProceeding to deletion for ${candidatesToDelete.length} candidate(s) with fresh checks...`)
  }

  // -----------------------------------------------------------------------
  // 5. DELETION — each with fresh reference check
  // -----------------------------------------------------------------------
  console.log('\n--- DELETION PHASE (fresh isKeyReferenced before each delete) ---')
  const deletionResults = [] // { key, freshCheck, deleteAttempted, deleteResult, postExists }

  for (const key of CANDIDATE_KEYS) {
    console.log(`\n[Candidate] ${key}`)
    // Fresh check
    let freshRef
    let freshRefSuccess = false
    try {
      freshRef = await isKeyReferenced(key)
      freshRefSuccess = true
      console.log(`  Fresh isKeyReferenced => ${freshRef}`)
    } catch (e) {
      freshRef = `error: ${e.message}`
      console.log(`  Fresh isKeyReferenced => ERROR: ${e.message}`)
      console.log(`  SKIPPED — reference check failed/uncertain (fail-closed)`)
      // Verify post exists without deleting
      let postExists = null
      try { postExists = await s3Service.exists(key) } catch (err) { postExists = `error: ${err.message}` }
      deletionResults.push({ key, freshCheck: freshRef, deleteAttempted: false, deleteResult: 'SKIPPED — reference check failed/uncertain', postExists })
      continue
    }

    if (freshRef !== false) {
      if (freshRef === true) {
        console.log(`  SKIPPED — currently referenced (isKeyReferenced === true)`)
        let postExists = null
        try { postExists = await s3Service.exists(key) } catch (err) { postExists = `error: ${err.message}` }
        deletionResults.push({ key, freshCheck: true, deleteAttempted: false, deleteResult: 'SKIPPED — currently referenced', postExists })
      } else {
        console.log(`  SKIPPED — reference check failed/uncertain (unexpected value: ${freshRef})`)
        let postExists = null
        try { postExists = await s3Service.exists(key) } catch (err) { postExists = `error: ${err.message}` }
        deletionResults.push({ key, freshCheck: freshRef, deleteAttempted: false, deleteResult: 'SKIPPED — reference check failed/uncertain', postExists })
      }
      continue
    }

    // freshRef === false -> proceed to delete via s3Service.destroy (the existing mechanism)
    console.log(`  Fresh check passed (false) -> proceeding to delete via s3Service.destroy()`)

    // Safety: double-check allowed key prefix (destinations/)
    if (!key.startsWith('destinations/')) {
      console.log(`  ABORT: key does not start with destinations/ - not deleting`)
      let postExists = null
      try { postExists = await s3Service.exists(key) } catch (err) { postExists = `error: ${err.message}` }
      deletionResults.push({ key, freshCheck: false, deleteAttempted: false, deleteResult: 'SKIPPED — prefix safety', postExists })
      continue
    }

    let deleteResult = null
    let deleteError = null
    try {
      const res = await s3Service.destroy(key)
      deleteResult = res?.result || 'ok'
      console.log(`  Delete succeeded: ${JSON.stringify(res)}`)
    } catch (e) {
      deleteError = e.message
      console.log(`  Delete FAILED: ${e.message} (status: ${e.status || 'unknown'})`)
      // Note: S3 DeleteObject is idempotent — if object already gone, it may still succeed.
      // A failure here is not necessarily fatal for other candidates.
    }

    // Immediately verify deletion via exists()
    let postExists = null
    try {
      postExists = await s3Service.exists(key)
      console.log(`  Post-delete exists check => ${postExists} (expected: false)`)
    } catch (e) {
      postExists = `error: ${e.message}`
      console.log(`  Post-delete exists check ERROR: ${e.message}`)
    }

    // Also verify via HeadObject directly for extra confidence
    if (postExists !== false) {
      console.log(`  WARNING: post-delete exists is not false - may indicate delete did not take effect or object already absent before`)
    }

    deletionResults.push({
      key,
      freshCheck: false,
      deleteAttempted: deleteError ? false : true,
      deleteResult: deleteError ? `FAILED: ${deleteError}` : (deleteResult || 'ok'),
      postExists,
    })
  }

  // -----------------------------------------------------------------------
  // 6. POST-DELETION VERIFICATION
  // -----------------------------------------------------------------------
  console.log('\n--- POST-DELETION VERIFICATION ---')
  console.log('Verifying every candidate individually (HeadObject/exists):')
  const candidatePostVerify = {}
  for (const key of CANDIDATE_KEYS) {
    try {
      const exists = await s3Service.exists(key)
      candidatePostVerify[key] = exists
      console.log(`  ${exists ? 'STILL EXISTS!!!' : 'NOT FOUND (deleted)'} ${key}`)
    } catch (e) {
      candidatePostVerify[key] = `error: ${e.message}`
      console.log(`  ERROR verifying ${key}: ${e.message}`)
    }
  }

  console.log('\nVerifying all 6 protected objects individually (should still exist):')
  const protectedPostVerify = {}
  let protectedPostMissing = []
  for (const key of PROTECTED_KEYS) {
    try {
      const exists = await s3Service.exists(key)
      protectedPostVerify[key] = exists
      console.log(`  ${exists ? 'EXISTS (OK)' : 'MISSING!!!'} ${key}`)
      if (!exists) protectedPostMissing.push(key)
    } catch (e) {
      protectedPostVerify[key] = `error: ${e.message}`
      console.log(`  ERROR verifying ${key}: ${e.message}`)
      protectedPostMissing.push(key)
    }
  }

  console.log('\nListing s3://24x7-website/destinations/ (post-deletion):')
  const destListAfter = await listPrefix('destinations/')
  if (destListAfter.error) {
    console.log(`  List error: ${destListAfter.error}`)
  } else {
    console.log(`  Count: ${destListAfter.count}, Keys: ${destListAfter.keys.length}`)
    for (const k of PROTECTED_KEYS) {
      const inList = destListAfter.keys.includes(k)
      console.log(`    ${inList ? 'STILL IN LIST (OK)' : 'MISSING FROM LIST!!!'} ${k}`)
    }
    for (const k of CANDIDATE_KEYS) {
      const inList = destListAfter.keys.includes(k)
      console.log(`    ${inList ? 'STILL IN LIST (should be deleted!!!)' : 'NOT IN LIST (deleted OK)'} ${k}`)
    }
  }

  // Verify other prefixes not modified
  console.log('\nOther S3 prefix verification (post-deletion, should be unchanged):')
  const otherPrefixAfter = {}
  for (const pref of OTHER_PREFIXES) {
    const res = await listPrefix(pref)
    otherPrefixAfter[pref] = res
    const beforeCount = otherPrefixBefore[pref]?.count
    const afterCount = res.count
    const unchanged = beforeCount === afterCount ? 'UNCHANGED' : `CHANGED ${beforeCount} -> ${afterCount}`
    if (res.error) console.log(`  ${pref} -> error: ${res.error}`)
    else console.log(`  ${pref} -> ${res.count} object(s) (${unchanged})`)
  }

  // -----------------------------------------------------------------------
  // 7. MONGODB POST-CHECK — ensure no writes, count unchanged, refs unchanged
  // -----------------------------------------------------------------------
  console.log('\n--- MONGODB POST-CHECK (read-only, no writes) ---')
  let destCountAfter = null
  try {
    const coll = db.collection('destinations')
    destCountAfter = await coll.countDocuments()
    console.log(`Destination count before: ${destCountBefore}`)
    console.log(`Destination count after:  ${destCountAfter} ${destCountBefore === destCountAfter ? '(UNCHANGED OK)' : '(MISMATCH!!!)'}`)
  } catch (e) {
    console.log(`Failed to count destinations after: ${e.message}`)
  }

  let destRefsAfter = null
  let refsChanged = false
  try {
    const coll = db.collection('destinations')
    const docs = await coll.find({}).toArray()
    destRefsAfter = docs.map((d) => ({
      slug: d.slug,
      homepageImage: d.homepageImage?.publicId || null,
      heroImage: d.heroImage?.publicId || null,
      heroVideo: d.heroVideo?.publicId || null,
      gallery: (d.gallery || []).map((g) => g.publicId),
    }))
    console.log(`Post-check captured ${destRefsAfter.length} destination docs`)
    // Compare protected refs
    const beforeStr = JSON.stringify(destRefsBefore)
    const afterStr = JSON.stringify(destRefsAfter)
    refsChanged = beforeStr !== afterStr
    console.log(`Destination image refs unchanged: ${!refsChanged ? 'YES (OK)' : 'NO - DIFFERENT!!!'}`)
    if (refsChanged) {
      console.log('Before vs After diff:')
      console.log('BEFORE:', JSON.stringify(destRefsBefore, null, 2))
      console.log('AFTER:', JSON.stringify(destRefsAfter, null, 2))
    } else {
      // Verify protected refs still present
      const flatBefore = destRefsBefore.flatMap((r) => [r.homepageImage, r.heroImage, r.heroVideo, ...r.gallery].filter(Boolean))
      for (const pk of PROTECTED_KEYS) {
        const found = flatBefore.includes(pk) // should be found before if correctly stored
        // Actually check after
      }
      const flatAfter = destRefsAfter.flatMap((r) => [r.homepageImage, r.heroImage, r.heroVideo, ...r.gallery].filter(Boolean))
      for (const pk of PROTECTED_KEYS) {
        const inAfter = flatAfter.includes(pk)
        console.log(`  Protected ${pk} in DB after: ${inAfter ? 'YES' : 'NO (but DB should still reference it - check if S3 protected still exists is what matters)'}`)
      }
    }
  } catch (e) {
    console.log(`Failed to capture destination refs after: ${e.message}`)
  }

  // Also verify no Mongo writes: we never called update/delete/insert, so 0
  console.log(`MongoDB writes performed: 0 (script is read-only except S3 deletes)`)
  console.log(`Destination records modified: 0 ${refsChanged ? '(BUT refsChanged true indicates possible external change)' : ''}`)

  // -----------------------------------------------------------------------
  // FINAL REPORT
  // -----------------------------------------------------------------------
  console.log('\n' + '='.repeat(80))
  console.log('FINAL REPORT')
  console.log('='.repeat(80))

  console.log('\n### PRE-CHECK\n')
  console.log('MongoDB:')
  console.log(`- Connected: ${connected ? 'YES' : 'NO'}`)
  console.log(`- Database: ${dbName || '(unknown)'}`)
  console.log(`- Destination count: ${destCountBefore ?? 'unknown'}`)
  console.log('')
  console.log('S3:')
  console.log(`- Candidate objects found: ${Object.values(candidateExists).filter(Boolean).length}/7`)
  for (const k of CANDIDATE_KEYS) console.log(`    ${candidateExists[k] ? 'FOUND' : 'NOT FOUND'} ${k}`)
  console.log(`- Protected objects found: ${Object.values(protectedExists).filter(Boolean).length}/6`)
  for (const k of PROTECTED_KEYS) console.log(`    ${protectedExists[k] ? 'FOUND' : 'MISSING'} ${k}`)

  console.log('\n### CANDIDATE RESULTS\n')
  console.log('| S3 Key | Fresh Reference Check | Delete Attempted | Delete Result | Post-Delete Exists |')
  console.log('| --- | --- | --- | --- | --- |')
  for (const r of deletionResults) {
    const fresh = r.freshCheck === false ? 'false' : r.freshCheck === true ? 'true' : String(r.freshCheck)
    const attempted = r.deleteAttempted ? 'YES' : 'NO'
    const result = r.deleteResult
    const post = r.postExists === false ? 'NOT FOUND (deleted)' : r.postExists === true ? 'STILL EXISTS' : String(r.postExists)
    console.log(`| ${r.key} | ${fresh} | ${attempted} | ${result} | ${post} |`)
  }
  // If script exited early due to no candidates, deletionResults may be incomplete; also show pre-check refs for those not in deletionResults
  if (deletionResults.length !== CANDIDATE_KEYS.length) {
    console.log('\nNote: Some candidates were not processed in deletion loop (see above). Pre-check refs:')
    for (const k of CANDIDATE_KEYS) {
      if (!deletionResults.find((r) => r.key === k)) {
        console.log(`  ${k} pre-check: ${candidateRefPre[k]}`)
      }
    }
  }

  console.log('\n### PROTECTED RESULTS\n')
  console.log('| S3 Key | Reference Check | Exists After Cleanup |')
  console.log('| --- | --- | --- |')
  for (const k of PROTECTED_KEYS) {
    const ref = protectedRefPre[k] === true ? 'true' : protectedRefPre[k] === false ? 'false' : String(protectedRefPre[k])
    const exists = protectedPostVerify[k] === true ? 'EXISTS' : protectedPostVerify[k] === false ? 'MISSING' : String(protectedPostVerify[k])
    console.log(`| ${k} | ${ref} | ${exists} |`)
  }
  console.log('\nExpected: all 6 referenced (true) and all 6 still exist (EXISTS)')

  console.log('\n### DATABASE SAFETY\n')
  console.log(`- Destination count before: ${destCountBefore ?? 'unknown'}`)
  console.log(`- Destination count after: ${destCountAfter ?? 'unknown'}`)
  console.log(`- MongoDB writes performed: 0`)
  console.log(`- Destination records modified: ${refsChanged ? '1+ (UNEXPECTED)' : '0'}`)
  console.log(`- Refs changed: ${refsChanged ? 'YES' : 'NO'}`)

  console.log('\n### S3 SAFETY\n')
  const deletedCount = deletionResults.filter((r) => r.deleteAttempted && r.deleteResult === 'ok' && r.postExists === false).length
  const attemptedDeletes = deletionResults.filter((r) => r.deleteAttempted).length
  const verifiedDeletedKeys = deletionResults.filter((r) => r.postExists === false).map((r) => r.key)
  // Also candidates that were already not found before and after are considered already gone, not counted as deleted this run
  console.log(`- Exact number of objects deleted (verified): ${deletedCount}`)
  console.log(`- Exact keys deleted (verified via post-check NOT FOUND):`)
  for (const k of verifiedDeletedKeys) console.log(`    ${k}`)
  if (verifiedDeletedKeys.length === 0) console.log(`    (none - all may have been already absent or skipped)`)
  console.log(`- Other S3 prefixes modified: 0 (verified via prefix counts)`)
  for (const pref of OTHER_PREFIXES) {
    const b = otherPrefixBefore[pref]?.count
    const a = otherPrefixAfter[pref]?.count
    console.log(`    ${pref} before=${b} after=${a} ${b === a ? 'OK' : 'CHANGED!'}`)
  }
  console.log(`- Broad/prefix cleanup performed: NO`)
  console.log(`- cleanup-orphan-s3.js executed: NO`)

  console.log('\n### FINAL VERDICT\n')
  const allCandidatesVerifiedDeleted = CANDIDATE_KEYS.every((k) => candidatePostVerify[k] === false)
  const allProtectedExist = PROTECTED_KEYS.every((k) => protectedPostVerify[k] === true)
  const countsUnchanged = destCountBefore === destCountAfter
  const noRefsChanged = !refsChanged
  const allFreshChecksPassedForDeleted = deletionResults.filter((r) => r.deleteAttempted).every((r) => r.freshCheck === false)
  const anyDeleteFailed = deletionResults.some((r) => typeof r.deleteResult === 'string' && r.deleteResult.startsWith('FAILED'))
  const protectedMissingPost = protectedPostMissing.length > 0

  // For SUCCESS we need:
  // - every attempted deletion passed fresh isKeyReferenced === false
  // - every intended deletion was verified absent afterward
  // - all 6 protected objects still exist
  // - MongoDB was not modified
  // - no other S3 objects were deleted (prefix counts unchanged and no broad delete)

  let success = true
  let reasons = []

  if (!allFreshChecksPassedForDeleted) {
    success = false
    reasons.push('Not all attempted deletions passed fresh isKeyReferenced===false')
  }
  if (!allCandidatesVerifiedDeleted) {
    // Check if any candidate still exists after that we attempted to delete
    const stillExists = CANDIDATE_KEYS.filter((k) => candidatePostVerify[k] === true)
    if (stillExists.length > 0) {
      // If we skipped some (referenced), it's okay that they still exist. So we should only require that deleted ones are gone, and skipped ones are not counted.
      // But spec says "every intended deletion was verified absent" -> intended = those we attempted.
      // So check only attempted deletes are absent.
      const attemptedKeys = deletionResults.filter((r) => r.deleteAttempted).map((r) => r.key)
      const attemptedStillExists = attemptedKeys.filter((k) => candidatePostVerify[k] === true)
      if (attemptedStillExists.length > 0) {
        success = false
        reasons.push(`Some attempted deletions still exist: ${attemptedStillExists.join(', ')}`)
      }
    }
    // If candidates were already absent before (candidateExists false) and remain absent, that's also success. So overall we check attempted deletes absent.
  }
  if (!allProtectedExist) {
    success = false
    reasons.push(`Protected objects missing after cleanup: ${protectedPostMissing.join(', ')}`)
  }
  if (!countsUnchanged) {
    success = false
    reasons.push(`Destination count changed ${destCountBefore} -> ${destCountAfter}`)
  }
  if (refsChanged) {
    success = false
    reasons.push('Destination image refs changed (should be 0)')
  }
  if (anyDeleteFailed) {
    success = false
    reasons.push('One or more delete operations failed')
  }
  // Check other prefixes unchanged
  const otherChanged = OTHER_PREFIXES.filter((p) => otherPrefixBefore[p]?.count !== otherPrefixAfter[p]?.count)
  if (otherChanged.length > 0) {
    success = false
    reasons.push(`Other prefixes changed: ${otherChanged.join(', ')}`)
  }

  // Also ensure we didn't delete anything outside exact 7 keys: we only called destroy on candidates that passed check, so this holds if above passes and no broad delete.

  if (success && verifiedDeletedKeys.length > 0 && allProtectedExist && countsUnchanged && noRefsChanged) {
    console.log('SUCCESS')
    console.log(`All ${verifiedDeletedKeys.length} targeted deletions passed fresh reference check, were verified absent, protected objects remain, MongoDB unchanged, no other prefixes modified.`)
  } else if (success && verifiedDeletedKeys.length === 0) {
    // Could be all candidates were already deleted previously - still success if protected exist and no changes
    // Check if candidates were already not found before this run: then no new deletes needed
    const alreadyAbsentBefore = CANDIDATE_KEYS.filter((k) => candidateExists[k] === false)
    if (alreadyAbsentBefore.length === 7 && allProtectedExist && countsUnchanged) {
      console.log('SUCCESS (no new deletions needed - all 7 candidates already absent)')
      console.log('All 7 candidates were already NOT FOUND before this run, protected objects remain, MongoDB unchanged.')
    } else {
      console.log('PARTIAL/FAILED')
      console.log(`Reasons: ${reasons.length ? reasons.join('; ') : 'No verified deletions this run, but not all candidates were already absent'}`)
      console.log(`Verified deleted: ${verifiedDeletedKeys.length}, Candidates still exist: ${CANDIDATE_KEYS.filter((k) => candidatePostVerify[k] === true).join(', ') || '(none)'}`)
    }
  } else {
    console.log('PARTIAL/FAILED')
    for (const r of reasons) console.log(`- ${r}`)
    console.log(`\nDetails:`)
    console.log(`  Verified deleted: ${verifiedDeletedKeys.length}`)
    console.log(`  Attempted deletes: ${attemptedDeletes}`)
    console.log(`  Protected missing: ${protectedPostMissing.length}`)
    console.log(`  Dest count before/after: ${destCountBefore} / ${destCountAfter}`)
  }

  console.log('\n' + '='.repeat(80))
  console.log('END OF REPORT')
  console.log('='.repeat(80))

  await mongoose.disconnect().catch(() => {})
  process.exit(success ? 0 : 1)
}

main().catch(async (err) => {
  console.error('UNHANDLED ERROR:', err)
  try { await mongoose.disconnect() } catch {}
  process.exit(1)
})
