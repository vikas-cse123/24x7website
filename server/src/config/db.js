import mongoose from 'mongoose'
import config from './index.js'

function sanitizeMongoUri(uri) {
  try {
    const url = new URL(uri)
    // Hide password if present, keep host + db name for logging
    const host = url.host
    const dbName = url.pathname?.replace(/^\//, '').split('?')[0] || ''
    return `${url.protocol}//${host}/${dbName}`
  } catch {
    // Fallback: strip credentials manually
    return uri.replace(/\/\/.*@/, '//***:***@')
  }
}

export async function connectDB() {
  if (!config.mongoUri) {
    const err = new Error('MONGODB_URI is not set. Set it in .env (e.g. mongodb://127.0.0.1:27017/24x7-website)')
    console.error(err.message)
    throw err
  }
  if (!process.env.MONGODB_URI) {
    console.warn('WARNING: MONGODB_URI not set in environment, using default:', sanitizeMongoUri(config.mongoUri))
  }

  mongoose.set('strictQuery', true)

  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    })
    const sanitized = sanitizeMongoUri(config.mongoUri)
    console.log('MongoDB connected successfully')
    console.log(`Database: ${mongoose.connection.name} (${sanitized})`)
  } catch (err) {
    console.error('MongoDB connection error:', err.message)
    throw err
  }

  return mongoose.connection
}
