import config from '../config/index.js'

export function notFound(_req, res) {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  })
}

export function errorHandler(err, _req, res, _next) {
  // Always log server-side for debugging; never leak stacks to clients in production.
  console.error(err)
  const status = err.status || err.statusCode || 500

  // Validation details (Zod) are safe to return — they contain only field errors.
  const errors = err.errors || err.details || undefined

  // In production, hide internal 5xx messages (could contain stack/DB details).
  const isServerError = status >= 500
  const message =
    isServerError && config.isProduction
      ? 'Internal server error'
      : err.message || 'Internal server error'

  const body = { success: false, message }
  if (errors) body.errors = errors
  res.status(status).json(body)
}
