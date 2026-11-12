import { cleanHeadline, isRedundantSummary } from '../src/lib/headline'

describe('cleanHeadline', () => {
  it('strips a named source suffix', () => {
    expect(cleanHeadline('Rain hits Delhi - Times of India', 'Times of India')).toBe('Rain hits Delhi')
  })
  it('strips pipe suffixes case-insensitively', () => {
    expect(cleanHeadline('Rain hits Delhi | THE HINDU', 'The Hindu')).toBe('Rain hits Delhi')
  })
  it('strips repeated suffixes', () => {
    expect(cleanHeadline('Rain - NDTV - NDTV', 'ndtv')).toBe('Rain')
    expect(cleanHeadline('Rain - NDTV - NDTV')).toBe('Rain')
  })
  it('strips a short trailing segment without a source name', () => {
    expect(cleanHeadline('Rain hits Delhi - Hindustan Times')).toBe('Rain hits Delhi')
  })
  it('keeps hyphenated words and in-title dashes', () => {
    expect(cleanHeadline('Year-end sale opens', 'NDTV')).toBe('Year-end sale opens')
    expect(cleanHeadline('India vs Australia - live updates from the third day of the test', 'NDTV')).toBe(
      'India vs Australia - live updates from the third day of the test',
    )
  })
  it('does not strip a different source', () => {
    expect(cleanHeadline('Rain - NDTV', 'The Hindu')).toBe('Rain - NDTV')
  })
  it('never returns empty for a title that is only the source', () => {
    expect(cleanHeadline('NDTV', 'NDTV')).toBe('NDTV')
  })
  it('trims whitespace', () => {
    expect(cleanHeadline('  Rain  ')).toBe('Rain')
  })
})

describe('isRedundantSummary', () => {
  it('flags equal text ignoring case and punctuation', () => {
    expect(isRedundantSummary('Rain hits Delhi', 'rain hits delhi.')).toBe(true)
  })
  it('flags summary that repeats title with source suffix', () => {
    expect(isRedundantSummary('Rain hits Delhi - NDTV', 'Rain hits Delhi - NDTV')).toBe(true)
  })
  it('flags summary starting with the headline', () => {
    expect(isRedundantSummary('Rain hits Delhi', 'Rain hits Delhi NDTV')).toBe(true)
  })
  it('flags empty summaries', () => {
    expect(isRedundantSummary('Rain', '')).toBe(true)
    expect(isRedundantSummary('Rain', null)).toBe(true)
  })
  it('keeps distinct summaries', () => {
    expect(isRedundantSummary('Rain hits Delhi', 'Heavy showers flooded roads on Tuesday.')).toBe(false)
    expect(isRedundantSummary('Rain', 'Rainfall totals doubled')).toBe(false)
  })
})
