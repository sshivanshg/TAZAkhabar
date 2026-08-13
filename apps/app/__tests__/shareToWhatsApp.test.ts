import {
  formatWhatsAppShareText,
  isHttpsUrl,
  whatsAppShareUrl,
} from '../src/utils/shareToWhatsApp'

describe('formatWhatsAppShareText', () => {
  it('formats headline, summary, and read-more url', () => {
    expect(
      formatWhatsAppShareText({
        headline: 'Budget approved',
        summary: 'Council passed the annual plan.',
        sourceUrl: 'https://example.com/story/1',
      }),
    ).toBe(
      'Budget approved\n\nCouncil passed the annual plan.\n\nRead more: https://example.com/story/1',
    )
  })

  it('omits read-more when sourceUrl is missing', () => {
    expect(
      formatWhatsAppShareText({
        headline: 'Headline',
        summary: 'Summary',
      }),
    ).toBe('Headline\n\nSummary')
  })
})

describe('isHttpsUrl', () => {
  it('accepts https and rejects others', () => {
    expect(isHttpsUrl('https://example.com/a')).toBe(true)
    expect(isHttpsUrl('http://example.com/a')).toBe(false)
    expect(isHttpsUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpsUrl('')).toBe(false)
    expect(isHttpsUrl(undefined)).toBe(false)
  })
})

describe('whatsAppShareUrl', () => {
  it('encodes the message', () => {
    const url = whatsAppShareUrl('Hello & world')
    expect(url.startsWith('https://wa.me/?text=')).toBe(true)
    expect(url).toContain(encodeURIComponent('Hello & world'))
  })
})
