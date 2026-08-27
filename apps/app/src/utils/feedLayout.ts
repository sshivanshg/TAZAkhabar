import type { ArticleResponse } from '@tazakhabar/shared-types'
import { isHttpsUrl } from './shareToWhatsApp'

export type MobileFeedRow =
  | { kind: 'featured'; key: string; article: ArticleResponse; index: number }
  | { kind: 'related'; key: string; articles: ArticleResponse[] }
  | { kind: 'article'; key: string; article: ArticleResponse; index: number }
  | { kind: 'empty'; key: 'empty' }

function hasPhoto(article: ArticleResponse): boolean {
  return Boolean(article.imageUrl && isHttpsUrl(article.imageUrl))
}

function articleKey(article: ArticleResponse, index: number): string {
  return String(article.id ?? `article-${index}`)
}

/**
 * Google News–style mixed stream: photo stories at a regular cadence become
 * featured cards; the next two or three items become a related strip.
 * Text-only stories stay compact so image-less feeds keep a single column.
 */
export function buildMobileFeedRows(articles: ArticleResponse[]): MobileFeedRow[] {
  if (articles.length === 0) {
    return [{ kind: 'empty', key: 'empty' }]
  }

  const rows: MobileFeedRow[] = []
  let i = 0
  let sinceFeatured = 4

  while (i < articles.length) {
    const article = articles[i]!
    const feature = hasPhoto(article) && sinceFeatured >= 4

    if (feature) {
      rows.push({
        kind: 'featured',
        key: `featured-${articleKey(article, i)}`,
        article,
        index: i,
      })
      i += 1
      sinceFeatured = 0

      const related: ArticleResponse[] = []
      while (related.length < 3 && i < articles.length) {
        related.push(articles[i]!)
        i += 1
      }
      if (related.length >= 2) {
        rows.push({
          kind: 'related',
          key: `related-${articleKey(related[0]!, i)}`,
          articles: related,
        })
      } else {
        related.forEach((item, offset) => {
          const idx = i - related.length + offset
          rows.push({
            kind: 'article',
            key: articleKey(item, idx),
            article: item,
            index: idx,
          })
        })
      }
      continue
    }

    rows.push({
      kind: 'article',
      key: articleKey(article, i),
      article,
      index: i,
    })
    i += 1
    sinceFeatured += 1
  }

  return rows
}
