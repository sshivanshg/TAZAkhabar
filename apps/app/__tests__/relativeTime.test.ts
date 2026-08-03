import { formatRelativeTime } from '../src/utils/relativeTime'

describe('formatRelativeTime', () => {
  const now = Date.parse('2026-08-03T12:00:00.000Z')

  it('formats minutes and hours', () => {
    expect(formatRelativeTime('2026-08-03T11:58:00.000Z', now)).toBe('2 minutes ago')
    expect(formatRelativeTime('2026-08-03T10:00:00.000Z', now)).toBe('2 hours ago')
  })

  it('formats days and just now', () => {
    expect(formatRelativeTime('2026-08-03T11:59:50.000Z', now)).toBe('Just now')
    expect(formatRelativeTime('2026-08-01T12:00:00.000Z', now)).toBe('2 days ago')
  })
})
