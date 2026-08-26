const WORDS_PER_MINUTE = 200

/** Whole minutes of reading time from article text. Minimum 1 when any copy exists. */
export function estimateReadingMinutes(text: string | null | undefined): number | null {
  const words = (text ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) {
    return null
  }
  return Math.max(1, Math.round(words.length / WORDS_PER_MINUTE))
}

export function formatReadingTime(minutes: number | null | undefined): string | null {
  if (minutes == null || minutes < 1) {
    return null
  }
  return minutes === 1 ? '1 min read' : `${minutes} min read`
}
