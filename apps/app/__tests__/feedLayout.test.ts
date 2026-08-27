import type { ArticleResponse } from '@tazakhabar/shared-types'
import { buildMobileFeedRows } from '../src/utils/feedLayout'

const base: ArticleResponse = {
  id: 1,
  cityId: 2,
  headline: 'Story',
  summary: 'Summary',
  sourceName: 'City Times',
  sourceUrl: 'https://example.com/1',
  publishedAt: '2026-08-03T10:00:00.000Z',
  category: 'Local',
}

function article(id: number, image?: string): ArticleResponse {
  return {
    ...base,
    id,
    headline: `Story ${id}`,
    sourceUrl: `https://example.com/${id}`,
    imageUrl: image,
  }
}

describe('buildMobileFeedRows', () => {
  it('keeps a compact stream when stories have no photos', () => {
    const rows = buildMobileFeedRows([article(1), article(2), article(3)])
    expect(rows.map((row) => row.kind)).toEqual(['article', 'article', 'article'])
  })

  it('features a photo story and clusters the next items as related', () => {
    const rows = buildMobileFeedRows([
      article(1, 'https://cdn.example.com/a.jpg'),
      article(2),
      article(3),
      article(4),
      article(5),
    ])
    expect(rows[0]).toMatchObject({ kind: 'featured', article: { id: 1 } })
    expect(rows[1]).toMatchObject({ kind: 'related' })
    if (rows[1]?.kind === 'related') {
      expect(rows[1].articles.map((item) => item.id)).toEqual([2, 3, 4])
    }
    expect(rows[2]).toMatchObject({ kind: 'article', article: { id: 5 } })
  })

  it('returns an empty row when there are no stories', () => {
    expect(buildMobileFeedRows([])).toEqual([{ kind: 'empty', key: 'empty' }])
  })
})
