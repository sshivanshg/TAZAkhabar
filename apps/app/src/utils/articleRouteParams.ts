import type { ArticleResponse } from '@newsfeed/shared-types'
import type { BookmarkSnapshot } from '../storage/bookmarks'

/** Route params for `/article/[id]` — enables optimistic render before API reconcile. */
export type ArticleRouteParams = {
  id: string
  headline: string
  summary: string
  sourceName: string
  sourceUrl: string
  imageUrl: string
  publishedAt: string
  category: string
  city?: string
  feedCategory?: string
  date?: string
  lang?: string
}

export function articleRouteParams(
  article: ArticleResponse | BookmarkSnapshot,
  extras?: {
    city?: string
    feedCategory?: string
    date?: string
    lang?: string
  },
): ArticleRouteParams | null {
  if (article.id == null) {
    return null
  }
  return {
    id: String(article.id),
    headline: article.headline ?? '',
    summary: article.summary ?? '',
    sourceName: article.sourceName ?? '',
    sourceUrl: article.sourceUrl ?? '',
    imageUrl: article.imageUrl ?? '',
    publishedAt: article.publishedAt ?? '',
    category: article.category ?? '',
    city: extras?.city,
    feedCategory: extras?.feedCategory,
    date: extras?.date,
    lang: extras?.lang,
  }
}
