import { ZodError } from 'zod'

// Validate a request part against a Zod schema.
// `source` is one of 'body' | 'query' | 'params'.
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source])
    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }))
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      })
    }
    req[source] = result.data
    return next()
  }
}

export function isZodError(err) {
  return err instanceof ZodError
}
