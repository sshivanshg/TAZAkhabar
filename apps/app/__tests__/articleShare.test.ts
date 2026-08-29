import { isHttpsUrl } from '../src/utils/shareToWhatsApp'
import { articleShareUrl } from '../src/utils/shareArticle'
import { nextArticlePath } from '../src/utils/syncArticleUrl'
import { openArticleSource } from '../src/utils/openArticleSource'

describe('articleShareUrl', () => {
  it('uses the TazaKhabar website URL instead of the source URL', () => {
    expect(
      articleShareUrl({
        headline: 'A',
        sourceUrl: 'https://example.com/story',
      }),
    ).toBe('https://tazakhabar-site.pages.dev')
  })

  it('still shares the website URL when the source URL is not share-safe', () => {
    expect(
      articleShareUrl({
        headline: 'A',
        sourceUrl: 'http://example.com/story',
      }),
    ).toBe('https://tazakhabar-site.pages.dev')
  })
})

describe('nextArticlePath', () => {
  it('rewrites the article id and keeps query string', () => {
    expect(nextArticlePath('/article/7', '?city=jhansi', '', 8)).toBe(
      '/article/8?city=jhansi',
    )
  })

  it('returns null when the path does not change', () => {
    expect(nextArticlePath('/article/7', '', '', 7)).toBeNull()
    expect(nextArticlePath('/feed', '', '', 8)).toBeNull()
  })
})

describe('openArticleSource', () => {
  it('refuses non-https URLs', async () => {
    await expect(openArticleSource('javascript:alert(1)')).resolves.toBe(false)
    await expect(openArticleSource('http://example.com')).resolves.toBe(false)
    await expect(openArticleSource(undefined)).resolves.toBe(false)
    expect(isHttpsUrl('https://example.com')).toBe(true)
  })
})
