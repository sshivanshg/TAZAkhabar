import type { ArticleResponse } from '@tazakhabar/shared-types'
import type { FeedCategory } from '../theme/tokens'

/** Articles consumed by the top-stories cluster card on expanded layouts. */
export const EXPANDED_TOP_STORIES_COUNT = 4

export function collectArticleIds(articles: ArticleResponse[]): Set<number> {
  const ids = new Set<number>()
  for (const article of articles) {
    if (article.id != null) {
      ids.add(article.id)
    }
  }
  return ids
}

export type ExpandedFeedSlices = {
  topStories: ArticleResponse[]
  picks: ArticleResponse[]
  localRail: ArticleResponse[]
  forYou: ArticleResponse[]
  showBriefing: boolean
  showLocalRail: boolean
  pageTitle: string
}

type BuildExpandedFeedOptions = {
  category: FeedCategory
  desktop: boolean
  categoryLabel: string
}

/**
 * Partition the home feed into non-overlapping sections for tablet/desktop.
 * City edition lives only in the top bar — sections are classified by story role.
 */
export function buildExpandedFeedSlices(
  visibleArticles: ArticleResponse[],
  visibleTrending: ArticleResponse[],
  { category, desktop, categoryLabel }: BuildExpandedFeedOptions,
): ExpandedFeedSlices {
  const topStories = visibleArticles.slice(0, EXPANDED_TOP_STORIES_COUNT)
  const topStoryIds = collectArticleIds(topStories)
  const pickIds = collectArticleIds(visibleTrending)

  const showLocalRail = category === 'All' && desktop
  const localRail = showLocalRail
    ? visibleArticles
        .filter(
          (article) =>
            article.category === 'Local' &&
            (article.id == null || (!topStoryIds.has(article.id) && !pickIds.has(article.id))),
        )
        .slice(0, 8)
    : []
  const localIds = collectArticleIds(localRail)

  const consumed = new Set<number>([...topStoryIds, ...pickIds, ...localIds])
  const forYou = visibleArticles
    .slice(EXPANDED_TOP_STORIES_COUNT)
    .filter((article) => article.id == null || !consumed.has(article.id))

  return {
    topStories,
    picks: visibleTrending,
    localRail,
    forYou,
    showBriefing: category === 'All',
    showLocalRail: showLocalRail && localRail.length > 0,
    pageTitle: category === 'All' ? 'Your briefing' : categoryLabel,
  }
}

export type ExpandedListRow =
  | { kind: 'breaking'; key: 'breaking' }
  | { kind: 'picks-section'; key: 'picks-section' }
  | { kind: 'for-you-section'; key: 'for-you-section' }
  | { kind: 'empty'; key: 'empty' }
  | {
      kind: 'article-row'
      key: string
      left: ArticleResponse
      right?: ArticleResponse
      index: number
    }

function pairArticles(articles: ArticleResponse[], keyPrefix: string): ExpandedListRow[] {
  const rows: ExpandedListRow[] = []
  for (let i = 0; i < articles.length; i += 2) {
    const left = articles[i]
    if (!left) {
      continue
    }
    const right = articles[i + 1]
    rows.push({
      kind: 'article-row',
      key: `${keyPrefix}-${left.id ?? i}-${right?.id ?? 'end'}`,
      left,
      right,
      index: i,
    })
  }
  return rows
}

export function buildExpandedFeedRows(
  slices: ExpandedFeedSlices,
  loading: boolean,
): ExpandedListRow[] {
  const rows: ExpandedListRow[] = []

  if (slices.topStories.length > 0) {
    rows.push({ kind: 'breaking', key: 'breaking' })
  }
  if (slices.picks.length > 0) {
    rows.push({ kind: 'picks-section', key: 'picks-section' })
    rows.push(...pairArticles(slices.picks, 'pick'))
  }
  if (slices.forYou.length > 0) {
    rows.push({ kind: 'for-you-section', key: 'for-you-section' })
    rows.push(...pairArticles(slices.forYou, 'for-you'))
  }

  if (
    rows.length === 0 &&
    !loading &&
    slices.topStories.length === 0 &&
    slices.picks.length === 0
  ) {
    rows.push({ kind: 'empty', key: 'empty' })
  }

  return rows
}
