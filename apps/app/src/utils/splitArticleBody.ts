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
      blocks.push({ type: 'ul', items: nonEmpty.map(bulletText) })
      continue
    }

    if (nonEmpty.every(isQuoteLine)) {
      blocks.push({ type: 'quote', text: nonEmpty.map(quoteText).join(' ') })
      continue
    }

    if (nonEmpty.length === 1 && isQuoteLine(nonEmpty[0]!)) {
      blocks.push({ type: 'quote', text: quoteText(nonEmpty[0]!) })
      continue
    }

    blocks.push({ type: 'p', text: nonEmpty.join(' ').replace(/\s+/g, ' ').trim() })
  }

  return blocks
}
