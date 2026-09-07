import config from './config/index.js'
import app from './app.js'
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

  const server = app.listen(config.port)

  server.on('listening', () => {
    console.log(`24x7Chhutti API running on http://localhost:${config.port}`)
  })

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `\n` +
          `ERROR: Port ${config.port} is already in use.\n\n` +
          `Another backend process (or another service) is already listening on port ${config.port}.\n` +
          `Check what is using it:\n\n` +
          `  lsof -i :${config.port}\n\n` +
          `If it is a stale Node.js process from a previous dev session, stop it first,\n` +
          `then restart this server. Do NOT start a second backend on the same port.\n`
      )
      process.exit(1)
    }
    throw err
  })
}

start()
