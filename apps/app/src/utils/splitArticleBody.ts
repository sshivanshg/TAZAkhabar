export type ArticleBlock =
  | { type: 'p'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'ul'; items: string[] }

/** Split article body into non-empty paragraphs on blank lines. */
export function splitArticleBody(body: string | null | undefined): string[] {
  if (!body) {
    return []
  }
  return body
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function isBulletLine(line: string): boolean {
  return /^\s*[-*•]\s+\S/.test(line)
}

function bulletText(line: string): string {
  return line.replace(/^\s*[-*•]\s+/, '').trim()
}

function isQuoteLine(line: string): boolean {
  return /^\s*>\s+\S/.test(line)
}

function quoteText(line: string): string {
  return line.replace(/^\s*>\s?/, '').trim()
}

/** Publisher chrome such as e-paper “Download in high quality” CTAs. */
export function isDownloadCta(text: string): boolean {
  const normalized = text.trim().replace(/\s+/g, ' ')
  if (!normalized || normalized.length > 80) {
    return false
  }
  const lower = normalized.toLowerCase()
  if (/download in high[- ]quality/.test(lower)) {
    return true
  }
  if (/download/.test(lower) && /high[- ]quality/.test(lower)) {
    return true
  }
  if (/डाउनलोड/.test(normalized) && /हाई\s*क्वालिटी/.test(normalized)) {
    return true
  }
  return false
}

/**
 * Parse plain-text article copy into paragraphs, quotes, and bullet lists.
 * Does not interpret HTML — scraped bodies are stored as plain text.
 */
export function parseArticleBlocks(body: string | null | undefined): ArticleBlock[] {
  const paragraphs = splitArticleBody(body)
  const blocks: ArticleBlock[] = []

  for (const paragraph of paragraphs) {
    const lines = paragraph.split('\n').map((line) => line.trimEnd())
    const nonEmpty = lines.filter((line) => line.trim().length > 0)
    if (nonEmpty.length === 0) {
      continue
    }

    if (nonEmpty.every(isBulletLine)) {
      const items = nonEmpty.map(bulletText).filter((item) => !isDownloadCta(item))
      if (items.length > 0) {
        blocks.push({ type: 'ul', items })
      }
      continue
    }

    if (nonEmpty.every(isQuoteLine)) {
      const quoted = nonEmpty.map(quoteText).join(' ')
      if (!isDownloadCta(quoted)) {
        blocks.push({ type: 'quote', text: quoted })
      }
      continue
    }

    if (nonEmpty.length === 1 && isQuoteLine(nonEmpty[0]!)) {
      const quoted = quoteText(nonEmpty[0]!)
      if (!isDownloadCta(quoted)) {
        blocks.push({ type: 'quote', text: quoted })
      }
      continue
    }

    const text = nonEmpty.join(' ').replace(/\s+/g, ' ').trim()
    if (!isDownloadCta(text)) {
      blocks.push({ type: 'p', text })
    }
  }

  return blocks
}
