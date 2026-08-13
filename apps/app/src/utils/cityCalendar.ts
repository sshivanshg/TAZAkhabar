/** City-local calendar helpers (MVP: all cities use Asia/Kolkata / IST). */

const CITY_TZ = 'Asia/Kolkata'

function partsInCityTz(instant: Date = new Date()): {
  year: number
  month: number
  day: number
} {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: CITY_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = fmt.formatToParts(instant)
  const year = Number(parts.find((p) => p.type === 'year')?.value)
  const month = Number(parts.find((p) => p.type === 'month')?.value)
  const day = Number(parts.find((p) => p.type === 'day')?.value)
  return { year, month, day }
}

/** Today's date as YYYY-MM-DD in the city's timezone. */
export function todayCityIso(instant: Date = new Date()): string {
  const { year, month, day } = partsInCityTz(instant)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Shift a YYYY-MM-DD by N calendar days (not DST-sensitive for IST). */
export function shiftIsoDate(iso: string, deltaDays: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const utc = Date.UTC(y!, m! - 1, d! + deltaDays)
  const dt = new Date(utc)
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`
}

export function formatDateStripLabel(iso: string, todayIso: string): string {
  if (iso === todayIso) {
    return 'Today'
  }
  if (iso === shiftIsoDate(todayIso, -1)) {
    return 'Yesterday'
  }
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y!, m! - 1, d!))
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(dt)
}

export function formatPickerDateLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y!, m! - 1, d!))
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(dt)
}
