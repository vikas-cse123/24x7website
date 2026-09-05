import { all as allCountries } from 'country-codes-list'

// Full international calling-code list for the login phone selector, generated
// from `country-codes-list` (standard phone metadata) instead of a hardcoded
// subset. India stays first (default market); the rest are alphabetical.
// Shape matches the LoginModal selector: `code` (+XX), `iso` (lowercase alpha-2
// for flagcdn images), `name` (display).
const PREFERRED = ['IN']

// Territories that duplicate a parent entry for dialing purposes and would
// only confuse the list (uninhabited, shares the parent's numbering plan).
const EXCLUDED = ['UM']

// Verbose ISO names → concise common English names.
const NAME_OVERRIDES = {
  UM: 'United States Minor Outlying Islands',
  TZ: 'Tanzania',
  CD: 'DR Congo',
  TW: 'Taiwan',
  BN: 'Brunei',
  BO: 'Bolivia',
  VA: 'Vatican City',
  FM: 'Micronesia',
  MH: 'Marshall Islands',
  MP: 'Northern Mariana Islands',
  BS: 'Bahamas',
  SX: 'Sint Maarten',
  MO: 'Macau',
  US: 'United States',
  VG: 'British Virgin Islands',
  VI: 'U.S. Virgin Islands',
}

function labelFor(iso, name) {
  return NAME_OVERRIDES[iso.toUpperCase()] || name
}

const generated = allCountries()
  .filter((c) => !EXCLUDED.includes(c.countryCode))
  .map((c) => ({
    code: `+${c.countryCallingCode}`,
    iso: c.countryCode.toLowerCase(),
    name: labelFor(c.countryCode, c.countryNameEn),
  }))
  .sort((a, b) => {
    const aPreferred = PREFERRED.includes(a.iso.toUpperCase())
    const bPreferred = PREFERRED.includes(b.iso.toUpperCase())
    if (aPreferred !== bPreferred) return aPreferred ? -1 : 1
    return a.name.localeCompare(b.name)
  })

export const COUNTRIES = generated
