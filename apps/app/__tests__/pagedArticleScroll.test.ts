import {
  ARTICLE_PAGE_TRANSITION_MS,
  easeInOutCubic,
  nextPageIndex,
  pageTransitionDuration,
} from '../src/utils/pagedArticleScroll'

describe('pagedArticleScroll', () => {
  it('moves one page at a time and clamps at the ends', () => {
    expect(nextPageIndex(0, 800, 1, 4)).toBe(1)
    expect(nextPageIndex(800, 800, -1, 4)).toBe(0)
    expect(nextPageIndex(0, 800, -1, 4)).toBe(0)
    expect(nextPageIndex(2400, 800, 1, 4)).toBe(3)
  })

  it('uses a slow eased duration unless reduced motion is on', () => {
    expect(ARTICLE_PAGE_TRANSITION_MS).toBeGreaterThanOrEqual(600)
    expect(pageTransitionDuration(false)).toBe(ARTICLE_PAGE_TRANSITION_MS)
    expect(pageTransitionDuration(true)).toBe(0)
  })

  it('eases in and out rather than jumping linearly', () => {
    expect(easeInOutCubic(0)).toBe(0)
    expect(easeInOutCubic(1)).toBe(1)
    expect(easeInOutCubic(0.25)).toBeLessThan(0.25)
    expect(easeInOutCubic(0.75)).toBeGreaterThan(0.75)
  })
})
