// Single source of truth for phone-number display/normalization.
// Ensures no "++91" duplication regardless of stored shape.

function normalizeCountryCode(countryCode) {
  if (countryCode == null) return ''
  const digits = String(countryCode).replace(/\D/g, '')
  if (!digits) return ''
  return `+${digits}`
}

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '')
}

/**
 * Format a mobile/phone for display with a single country code prefix.
 * Handles:
 * - countryCode '+91' or '91' -> display '+91 ...'
 * - mobile '9876543210' or '+91 9876543210' or '919876543210' (digits with prefix)
 * - Avoids duplicate prefix when mobile already contains the code.
 *
 * Examples:
 *   formatPhone('9876543210', '+91') => '+91 9876543210'
 *   formatPhone('9876543210', '91') => '+91 9876543210'
 *   formatPhone('+91 9876543210', '+91') => '+91 9876543210' (no ++)
 *   formatPhone('919876543210', '+91') => '+91 9876543210' (strips leading 91 if length>10)
 *   formatPhone('9167834595', '+91') => '+91 9167834595' (kept, since 10 digits starting 91)
 */
export function formatPhone(mobileOrPhone, countryCode) {
  const cc = normalizeCountryCode(countryCode)
  const raw = String(mobileOrPhone || '').trim()
  if (!raw && !cc) return ''
  if (!raw) return cc
  if (!cc) {
    // No country code: return as-is but clean leading ++
    return raw.replace(/^\++/, '+')
  }
  const ccDigits = cc.replace(/\D/g, '')
  const rawDigits = digitsOnly(raw)
  const hasPlus = raw.trim().startsWith('+')

  // If raw starts with the same country code with plus, strip it.
  // e.g., raw='+91 98765...' and cc='+91' -> strip '+91'
  if (hasPlus) {
    const withoutSpaces = raw.replace(/\s+/g, '')
    if (withoutSpaces.startsWith(cc)) {
      const stripped = raw.trim().slice(cc.length).trim().replace(/^[\s-]+/, '')
      const strippedDigits = digitsOnly(stripped)
      // stripped may be empty if raw was just cc
      if (strippedDigits) return `${cc} ${strippedDigits}`.trim()
      return cc
    }
    // also handle '+919876543210' without space
    if (rawDigits.startsWith(ccDigits) && rawDigits.length > 10) {
      const rest = rawDigits.slice(ccDigits.length)
      if (rest.length >= 6) return `${cc} ${rest}`.trim()
    }
    // fallback: if we couldn't strip cleanly, just return normalized digits
    // but avoid ++
    return `${cc} ${rawDigits.startsWith(ccDigits) ? rawDigits.slice(ccDigits.length) : rawDigits}`.trim().replace(/\s+/g, ' ')
  }

  // raw without plus: e.g., '919876543210' or '9876543210' or '91 9876543210'
  if (rawDigits.startsWith(ccDigits) && rawDigits.length > 10) {
    // Contains country code digits without plus, e.g., 919876543210
    const rest = rawDigits.slice(ccDigits.length)
    // Keep numbers that merely start with 91 but are 10 digits (e.g., 9167834595) intact
    // Only strip when total length > 10 (indicates explicit code)
    if (rest.length >= 6) return `${cc} ${rest}`.trim()
  }

  // Normal case: cc + raw digits/spaces cleaned
  // If raw already contains spaces/dashes, we keep digits only for predictable display
  // but preserve original if it had formatting? Use digits for now.
  const cleaned = rawDigits
  // Edge: if cleaned already equals ccDigits? ignore
  if (cleaned === ccDigits) return cc
  return `${cc} ${cleaned}`.trim().replace(/\s+/g, ' ')
}

/**
 * Normalize a phone value for tel: href — keep leading + and digits only.
 */
export function toTelHref(mobileOrPhone, countryCode) {
  const formatted = formatPhone(mobileOrPhone, countryCode)
  // formatted is like '+91 9876543210' -> '+919876543210'
  return formatted.replace(/[^\d+]/g, '')
}

/**
 * Format a phone already containing country code (e.g., settings contact.phone)
 * for display, avoiding duplicate prefix.
 * If phone already starts with +<code>, return it cleaned (single +).
 * Otherwise prefix with countryCode.
 */
export function formatContactPhone(phone, countryCode = '+91', showCountryCode = true) {
  if (!phone) return ''
  const trimmed = String(phone).trim()
  if (!showCountryCode) return trimmed.replace(/^\++/, '+')
  // If showCountryCode, ensure single prefix
  // Use formatPhone which already handles duplication
  // Extract country code to use: if phone starts with +digits, use that code, else use provided countryCode
  const hasPlus = trimmed.startsWith('+')
  if (hasPlus) {
    return trimmed.replace(/^\++/, '+').replace(/\s+/g, ' ').trim()
  }
  // No plus in stored phone: prefix with countryCode
  return formatPhone(trimmed, countryCode)
}
