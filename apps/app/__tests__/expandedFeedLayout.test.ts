import type { ArticleResponse } from '@tazakhabar/shared-types'
import {
  buildExpandedFeedRows,
  buildExpandedFeedSlices,
} from '../src/utils/expandedFeedLayout'

function article(id: number, category = 'Local'): ArticleResponse {
  return {
    id,
    cityId: 1,
    headline: `Story ${id}`,
    summary: 'Summary',
    sourceName: 'Source',
    sourceUrl: `https://example.com/${id}`,
    publishedAt: '2026-09-01T10:00:00.000Z',
    category,
  }
}

describe('buildExpandedFeedSlices', () => {
  it('keeps sections disjoint and hides local rail when not on home', () => {
    const visible = Array.from({ length: 10 }, (_, i) => article(i + 1))
    const trending = [article(99, 'Sports')]

    const home = buildExpandedFeedSlices(visible, trending, {
      category: 'All',
      desktop: true,
      categoryLabel: 'For you',
    })

    expect(home.topStories).toHaveLength(4)
    expect(home.picks.map((a) => a.id)).toEqual([99])
    expect(home.localRail.every((a) => a.category === 'Local')).toBe(true)
    expect(home.localRail.some((a) => a.id != null && a.id <= 4)).toBe(false)
    expect(home.forYou.some((a) => a.id === 99)).toBe(false)
    expect(home.showBriefing).toBe(true)
    expect(home.showLocalRail).toBe(true)

    const sports = buildExpandedFeedSlices(visible, trending, {
      category: 'Sports',
      desktop: true,
      categoryLabel: 'Sports',
    })

    expect(sports.showBriefing).toBe(false)
    expect(sports.showLocalRail).toBe(false)
    expect(sports.pageTitle).toBe('Sports')
  })
})

describe('buildExpandedFeedRows', () => {
  it('emits section headers before paired article rows', () => {
    const slices = buildExpandedFeedSlices(
      Array.from({ length: 6 }, (_, i) => article(i + 1)),
      [article(99, 'Sports')],
      { category: 'All', desktop: false, categoryLabel: 'For you' },
    )
    const rows = buildExpandedFeedRows(slices, false)
    expect(rows.map((row) => row.kind)).toEqual([
      'breaking',
      'picks-section',
      'article-row',
      'for-you-section',
      'article-row',
    ])
  })
})
