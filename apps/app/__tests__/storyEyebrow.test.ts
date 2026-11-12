import { storyEyebrow } from '../src/components/article/eyebrow'

describe('storyEyebrow', () => {
  it('uses the reader city', () => {
    expect(storyEyebrow('new-delhi', 'Politics')).toBe('NEW DELHI')
  })

  it('falls back to the category for the global feed, never GLOBAL', () => {
    expect(storyEyebrow('global', 'Politics')).toBe('Politics')
    expect(storyEyebrow('GLOBAL', 'Local')).toBeUndefined()
    expect(storyEyebrow(undefined, 'global')).toBeUndefined()
  })
})
