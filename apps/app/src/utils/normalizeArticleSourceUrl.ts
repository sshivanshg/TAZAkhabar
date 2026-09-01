/** Decode common HTML entities in publisher URLs from RSS/API payloads. */
export function normalizeArticleSourceUrl(url: string | null | undefined): string | undefined {
  if (!url || typeof url !== 'string') {
    return undefined
  }

  const trimmed = url
    .trim()
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')

  return trimmed.length > 0 ? trimmed : undefined
}
