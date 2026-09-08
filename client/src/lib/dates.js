// Date-only display helpers.
//
// TripBatch dates travel over the API as ISO strings of UTC midnights
// (e.g. '2026-10-03T00:00:00.000Z'). Converting those with `new Date(iso)`
// would render them in the viewer's local timezone and can shift the visible
// calendar day. These helpers always work on the 'YYYY-MM-DD' portion, so
// 2026-10-03 can never display as Oct 2.

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function toDateOnly(iso) {
  if (!iso) return ''
  return String(iso).slice(0, 10)
}

function parseParts(dateOnly) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly || '')
  if (!match) return null
  return { y: Number(match[1]), m: Number(match[2]) - 1, d: Number(match[3]) }
}

// '2026-10-03' -> 'Oct 3'
export function formatDateShort(iso) {
  const p = parseParts(toDateOnly(iso))
  if (!p) return ''
  return `${MONTHS_SHORT[p.m]} ${p.d}`
}

// '2026-10-03' -> '10 Oct 2026'
export function formatDateLong(iso) {
  const p = parseParts(toDateOnly(iso))
  if (!p) return ''
  return `${p.d} ${MONTHS_SHORT[p.m]} ${p.y}`
}

export function formatDateTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    const fallback = formatDateLong(iso)
    return fallback || ''
  }
  const day = d.getDate()
  const month = MONTHS_SHORT[d.getMonth()]
  const year = d.getFullYear()
  let hours = d.getHours()
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  const hoursStr = String(hours).padStart(2, '0')
  return `${hoursStr}:${minutes} ${ampm}, ${day} ${month} ${year}`
}

// Whole nights between two date-only values (return - departure).
export function nightsBetween(fromIso, toIso) {
  const a = parseParts(toDateOnly(fromIso))
  const b = parseParts(toDateOnly(toIso))
  if (!a || !b) return null
  const ms = Date.UTC(b.y, b.m, b.d) - Date.UTC(a.y, a.m, a.d)
  return Math.max(0, Math.round(ms / 86400000))
}

// Today's UTC calendar date as 'YYYY-MM-DD' — matches server-side comparisons.
export function todayUtc() {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(
    now.getUTCDate()
  ).padStart(2, '0')}`
}
