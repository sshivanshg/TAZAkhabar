import { PUBLIC_PAGE_LINKS, PUBLIC_PAGES } from '../src/content/publicPages'

describe('public launch pages', () => {
  it('keeps every public route backed by substantive content', () => {
    expect(PUBLIC_PAGE_LINKS.map((link) => link.id)).toEqual([
      'about',
      'privacy',
      'terms',
      'support',
      'corrections',
    ])

    for (const link of PUBLIC_PAGE_LINKS) {
      const page = PUBLIC_PAGES[link.id]
      expect(link.href).toBe(`/${link.id}`)
      expect(page.title.length).toBeGreaterThan(5)
      expect(page.intro.length).toBeGreaterThan(30)
      expect(page.sections.length).toBeGreaterThanOrEqual(3)
    }
  })

  it('states the current no-account and manual-city privacy model', () => {
    const privacyCopy = JSON.stringify(PUBLIC_PAGES.privacy)
    expect(privacyCopy).toContain('does not require a reader account')
    expect(privacyCopy).toContain('No GPS or precise location permission')
    expect(privacyCopy).toContain('session identifier')
  })

  it('provides a correction path for automated summaries', () => {
    const correctionsCopy = JSON.stringify(PUBLIC_PAGES.corrections)
    expect(correctionsCopy).toContain('AI-assisted summaries')
    expect(correctionsCopy).toContain('update or remove the summary')
  })
})
