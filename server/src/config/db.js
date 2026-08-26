import mongoose from 'mongoose'
import config from './index.js'

export async function connectDB() {
  if (config.mongoUri === 'mongodb://127.0.0.1:27017/24x7chhutti' && !process.env.MONGODB_URI) {
    // Using the default local URI. Attempt connection anyway; failure is reported.
  }

  mongoose.set('strictQuery', true)

  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    })
    console.log('MongoDB connected:', mongoose.connection.name)
  } catch (err) {
    console.error('MongoDB connection error:', err.message)
    throw err
  }

  return mongoose.connection
}
