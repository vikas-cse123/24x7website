/**
 * ONE-TIME S3 cleanup: deletes ONLY travel-catalog media.
 *
 * Prefix allowlist (catalog-only folders — verified against the codebase):
 *   travel-crm/destinations/       (destination hero/gallery — import script + admin)
 *   travel-crm/trips/              (trip hero/gallery — import script + admin)
 *   travel-crm/destination-media/  (destination form uploads)
 *
 * NEVER touched: travel-crm/whatsapp/, travel-crm/brand-media/, travel-crm/website/,
 * travel-crm/blogs/, travel-crm/blog-media/, travel-crm/traveler-media/,
 * travel-crm/test/, bucket root, and anything outside the allowlist.
 *
 * Idempotent: re-running finds 0 objects and exits cleanly.
 *
 * Usage:
 *   node scripts/clear-travel-catalog-s3.mjs          # dry run: report only
 *   node scripts/clear-travel-catalog-s3.mjs --yes    # actually deletes
 */
import 'dotenv/config'
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3'

const APPLY = process.argv.includes('--yes')
const CATALOG_PREFIXES = [
  'travel-crm/destinations/',
  'travel-crm/trips/',
  'travel-crm/destination-media/',
]

const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET } = process.env
if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_S3_BUCKET) {
  console.error('ABORT: S3 env vars not configured.')
  process.exit(1)
}

const client = new S3Client({
  region: AWS_REGION,
  credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY },
})

async function listAll(prefix) {
  const keys = []
  let token
  do {
    const res = await client.send(
      new ListObjectsV2Command({ Bucket: AWS_S3_BUCKET, Prefix: prefix, ContinuationToken: token, MaxKeys: 1000 })
    )
    for (const obj of res.Contents || []) keys.push({ key: obj.Key, size: obj.Size || 0 })
    token = res.IsTruncated ? res.NextContinuationToken : undefined
  } while (token)
  return keys
}

console.log('Bucket:', AWS_S3_BUCKET, `(${AWS_REGION})`)
console.log('Mode:', APPLY ? 'APPLY (will delete)' : 'DRY RUN (report only)')
console.log('')

let allKeys = []
for (const prefix of CATALOG_PREFIXES) {
  const keys = await listAll(prefix)
  const bytes = keys.reduce((s, k) => s + k.size, 0)
  console.log(`${prefix}  ->  ${keys.length} objects, ${(bytes / 1024 / 1024).toFixed(2)} MB`)
  for (const sample of keys.slice(0, 3)) console.log(`    e.g. ${sample.key}`)
  allKeys.push(...keys)
}

// Sanity: every key MUST be under the allowlist (defence against prefix bugs).
allKeys = allKeys.filter((k) => CATALOG_PREFIXES.some((p) => k.key.startsWith(p)))

if (!APPLY) {
  console.log(`\nDry run complete: ${allKeys.length} catalog objects would be deleted. Re-run with --yes.`)
  process.exit(0)
}

console.log(`\nDeleting ${allKeys.length} objects in batches of 1000...`)
let deletedTotal = 0
for (let i = 0; i < allKeys.length; i += 1000) {
  const batch = allKeys.slice(i, i + 1000)
  if (batch.length === 0) break
  const res = await client.send(
    new DeleteObjectsCommand({
      Bucket: AWS_S3_BUCKET,
      Delete: { Objects: batch.map((k) => ({ Key: k.key })), Quiet: true },
    })
  )
  deletedTotal += batch.length - (res.Errors?.length || 0)
  if (res.Errors?.length) {
    for (const e of res.Errors) console.error(`  ERROR: ${e.Key}: ${e.Message}`)
  }
}
console.log(`Deleted ${deletedTotal} objects.`)

// Verify
console.log('\nPOST-DELETE VERIFICATION:')
for (const prefix of CATALOG_PREFIXES) {
  const remaining = await listAll(prefix)
  console.log(`  ${prefix} -> ${remaining.length} objects remaining`)
}
const whatsapp = await listAll('travel-crm/whatsapp/')
console.log(`  travel-crm/whatsapp/ -> ${whatsapp.length} objects (must remain intact)`)
process.exit(0)
