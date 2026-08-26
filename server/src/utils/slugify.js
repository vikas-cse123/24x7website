// URL-safe slug generation. No external slug package is needed for the small
// set of rules here.
export function slugify(value) {
  return String(value ?? '')
    .toLowerCase()
    .trim()
    // Keep letters, digits, spaces and hyphens; drop everything else.
    .replace(/[^a-z0-9\s-]/g, '')
    // Collapse whitespace/underscores into a single hyphen.
    .replace(/[\s_]+/g, '-')
    // Collapse repeated hyphens.
    .replace(/-+/g, '-')
    // Trim leading/trailing hyphens.
    .replace(/^-+|-+$/g, '')
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// Ensure a slug is unique within a Mongoose model by appending a numeric suffix
// on collision (e.g. `vietnam` → `vietnam-2`). Pass `excludeId` when updating.
export async function ensureUniqueSlug(Model, baseSlug, excludeId = null) {
  let slug = baseSlug
  let counter = 2
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const query = { slug }
    if (excludeId) query._id = { $ne: excludeId }
    const existing = await Model.findOne(query).select('_id').lean()
    if (!existing) return slug
    slug = `${baseSlug}-${counter}`
    counter += 1
  }
}