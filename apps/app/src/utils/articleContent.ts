import { parseArticleBlocks, type ArticleBlock } from './splitArticleBody'

function normalizeForCompare(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase()
}

function summaryContainedInBody(summary: string, body: string): boolean {
  const normalizedSummary = normalizeForCompare(summary)
  const normalizedBody = normalizeForCompare(body)
  if (!normalizedSummary) {
    return true
  }
  return normalizedBody.includes(normalizedSummary)
}

export type ArticleDisplayContent = {
  ledeBlocks: ArticleBlock[]
  bodyBlocks: ArticleBlock[]
  hasReadableContent: boolean
}

/**
 * Build reader copy from API fields — show summary as a lede when it adds context,
 * then the full body. Avoid duplicating text when summary is already in the body.
 */
export function buildArticleDisplayContent(
  body: string | null | undefined,
  summary: string | null | undefined,
): ArticleDisplayContent {
  const rawBody = (body ?? '').trim()
  const rawSummary = (summary ?? '').trim()

  if (!rawBody && !rawSummary) {
    return { ledeBlocks: [], bodyBlocks: [], hasReadableContent: false }
  }

  if (!rawBody) {
    return {
      ledeBlocks: [],
      bodyBlocks: parseArticleBlocks(rawSummary),
      hasReadableContent: rawSummary.length > 0,
    }
  }

  if (!rawSummary || summaryContainedInBody(rawSummary, rawBody)) {
    const blocks = parseArticleBlocks(rawBody)
    return {
      ledeBlocks: [],
      bodyBlocks: blocks,
      hasReadableContent: blocks.length > 0,
    }
  }

  // Rewrite edge case: stored body is shorter than the card summary.
  if (rawBody.length < rawSummary.length * 0.65) {
    const merged = `${rawSummary}\n\n${rawBody}`
    const blocks = parseArticleBlocks(merged)
    return {
      ledeBlocks: [],
      bodyBlocks: blocks,
      hasReadableContent: blocks.length > 0,
    }
  }

  const ledeBlocks = parseArticleBlocks(rawSummary)
  const bodyBlocks = parseArticleBlocks(rawBody)
  return {
    ledeBlocks,
    bodyBlocks,
    hasReadableContent: ledeBlocks.length > 0 || bodyBlocks.length > 0,
  }
}

export function estimateArticleReadableText(content: ArticleDisplayContent): string {
  const allBlocks = [...content.ledeBlocks, ...content.bodyBlocks]
  return allBlocks
    .map((block) => (block.type === 'ul' ? block.items.join(' ') : block.text))
    .join(' ')
}
