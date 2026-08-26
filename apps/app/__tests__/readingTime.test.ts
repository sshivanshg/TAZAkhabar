import { estimateReadingMinutes, formatReadingTime } from '../src/utils/readingTime'
import { formatLocationLabel } from '../src/utils/formatLocationLabel'

describe('estimateReadingMinutes', () => {
  it('returns null for empty copy', () => {
    expect(estimateReadingMinutes('')).toBeNull()
    expect(estimateReadingMinutes('   ')).toBeNull()
  })

  it('rounds word count to whole minutes with a one-minute floor', () => {
    expect(estimateReadingMinutes('one two three')).toBe(1)
    const words = Array.from({ length: 400 }, (_, i) => `w${i}`).join(' ')
    expect(estimateReadingMinutes(words)).toBe(2)
  })
})

describe('formatReadingTime', () => {
  it('formats minutes', () => {
    expect(formatReadingTime(1)).toBe('1 min read')
    expect(formatReadingTime(3)).toBe('3 min read')
    expect(formatReadingTime(null)).toBeNull()
  })
})

describe('formatLocationLabel', () => {
  it('uppercases city slugs', () => {
    expect(formatLocationLabel('jhansi')).toBe('JHANSI')
    expect(formatLocationLabel('new-delhi')).toBe('NEW DELHI')
    expect(formatLocationLabel('')).toBeUndefined()
  })
})
