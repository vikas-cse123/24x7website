import { S3Client } from '@aws-sdk/client-s3'
import { NodeHttpHandler } from '@smithy/node-http-handler'

// AWS S3 configuration — credentials are read ONLY from the server
// environment. They are never exposed to the client/browser.
const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET } = process.env

export const isS3Configured = Boolean(
  AWS_REGION && AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && AWS_S3_BUCKET
)

// Virtual-hosted-style public URL for an object key, e.g.
// https://<bucket>.s3.<region>.amazonaws.com/<key>
export function s3ObjectUrl(bucket, region, key) {
  return `https://${bucket}.s3.${region}.amazonaws.com/${encodeURIComponent(key).replace(
    /%2F/g,
    '/'
  )}`
}

export const s3Config = {
  region: AWS_REGION || '',
  bucket: AWS_S3_BUCKET || '',
  getUrl: (key) => (key ? s3ObjectUrl(AWS_S3_BUCKET || '', AWS_REGION || '', key) : ''),
  getProxyUrl: (key) => (key ? `/api/media/${encodeURIComponent(key).replace(/%2F/g, '/')}` : ''),
}

export const s3Client = isS3Configured
  ? new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
      maxAttempts: 2,
      requestHandler: new NodeHttpHandler({
        requestTimeout: 12000,
        connectionTimeout: 5000,
      }),
    })
  : null

export default s3Client