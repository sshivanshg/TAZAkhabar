import { sectionTitle } from '../src/utils/feedSectionTitle'

const t = (key: string) => `T(${key})`

describe('sectionTitle', () => {
  it('maps the API top/more keys to catalog keys', () => {
    expect(sectionTitle({ key: 'top', title: 'Top stories' }, t)).toBe('T(home.topStories)')
    expect(sectionTitle({ key: 'more', title: 'More stories' }, t)).toBe('T(home.moreStories)')
  })
  it('maps known category sections to category labels', () => {
    expect(sectionTitle({ key: 'health', title: 'Health', category: 'Health' }, t)).toBe('T(category.Health)')
  })
  it('falls back to the API title', () => {
    expect(sectionTitle({ key: 'weird', title: 'Weird' }, t)).toBe('Weird')
    expect(sectionTitle({}, t)).toBe('')
  })
})
