import app from './app.js'
import config from './config/index.js'
import { connectDB } from './config/db.js'

async function start() {
  // Attempt to connect to MongoDB. If it fails, log a clear warning but still
  // start the HTTP server so /api/health remains reachable.
  try {
    await connectDB()
  } catch (err) {
    console.warn(
      'WARNING: Could not connect to MongoDB. Auth endpoints will fail until a ' +
        `database is available. Reason: ${err.message}`
    )
  }

  app.listen(config.port, () => {
    console.log(`24x7Chhutti API running on http://localhost:${config.port}`)
  })
}

start()
