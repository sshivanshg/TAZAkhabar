const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

/** Relative time for feed cards — e.g. "2 hours ago". */
export function formatRelativeTime(iso: string | undefined, nowMs: number = Date.now()): string {
  if (!iso) {
    return ''
  }

  const then = Date.parse(iso)
  if (Number.isNaN(then)) {
    return ''
  }

  const deltaSec = Math.max(0, Math.round((nowMs - then) / 1000))

  if (deltaSec < MINUTE) {
    return 'Just now'
  }
  if (deltaSec < HOUR) {
    const m = Math.floor(deltaSec / MINUTE)
    return m === 1 ? '1 minute ago' : `${m} minutes ago`
  }
  if (deltaSec < DAY) {
    const h = Math.floor(deltaSec / HOUR)
    return h === 1 ? '1 hour ago' : `${h} hours ago`
  }

  const d = Math.floor(deltaSec / DAY)
  return d === 1 ? '1 day ago' : `${d} days ago`
}
