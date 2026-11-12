const SEPARATORS = '[-–—|]'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Strip trailing " - Source" / " | Source" suffixes that aggregators append
 * (repeated ones too). With a sourceName, only that source is stripped; without
 * one, a single trailing short segment (≤ 5 words) is treated as a source.
 */
export function cleanHeadline(title: string, sourceName?: string | null): string {
  let result = title.trim()
  const source = sourceName?.trim()
  if (source) {
    const pattern = new RegExp(`\\s+${SEPARATORS}\\s+${escapeRegExp(source)}\\s*$`, 'i')
    let next = result.replace(pattern, '').trim()
    while (next !== result && next.length > 0) {
      result = next
      next = result.replace(pattern, '').trim()
    }
    return result
  }
  const generic = new RegExp(`^(.*\\S)\\s+${SEPARATORS}\\s+([^-–—|]+)$`)
  const match = result.match(generic)
  if (match && match[2]!.trim().split(/\s+/).length <= 5) {
    const head = match[1]!.trim()
    // Collapse a repeated identical suffix ("X - A - A").
    const repeat = cleanHeadline(head, match[2]!.trim())
    return repeat.length > 0 ? repeat : head
  }
  return result
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** True when the summary adds nothing: equal to the headline or starts with it. */
export function isRedundantSummary(
  title: string | null | undefined,
  summary: string | null | undefined,
): boolean {
  if (!summary || !summary.trim()) return true
  if (!title) return false
  const t = normalize(cleanHeadline(title))
  const s = normalize(summary)
  if (!t || !s) return !s
  return s === t || s.startsWith(`${t} `) || s === normalize(title)
}
