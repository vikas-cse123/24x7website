// One-time S3 audit: counts + sizes per top-level prefix under travel-crm/
import 'dotenv/config'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET } = process.env
if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_S3_BUCKET) {
  console.error('S3 not configured in env')
  process.exit(1)
}
const client = new S3Client({ region: AWS_REGION, credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY } })
const BUCKET = AWS_S3_BUCKET

// Walk the entire bucket (every key), then group by second-level prefix.
const groups = new Map()
let total = 0
let token
do {
  const res = await client.send(new ListObjectsV2Command({ Bucket: BUCKET, ContinuationToken: token, MaxKeys: 1000 }))
  for (const obj of res.Contents || []) {
    total++
    const parts = obj.Key.split('/')
    const prefix = parts.length > 1 ? `${parts[0]}/${parts[1]}` : '(root files)'
    const g = groups.get(prefix) || { count: 0, bytes: 0, samples: [] }
    g.count++
    g.bytes += obj.Size || 0
    if (g.samples.length < 3) g.samples.push(`${obj.Key} (${obj.Size}b)`)
    groups.set(prefix, g)
  }
  token = res.IsTruncated ? res.NextContinuationToken : undefined
} while (token)

console.log(`BUCKET: ${BUCKET}  region: ${AWS_REGION}`)
console.log(`TOTAL OBJECTS IN BUCKET: ${total}\n`)
const sorted = [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0]))
for (const [prefix, g] of sorted) {
  console.log(`${prefix}  ->  ${g.count} objects, ${(g.bytes / 1024).toFixed(1)} KB`)
  for (const s of g.samples) console.log(`    e.g. ${s}`)
}
