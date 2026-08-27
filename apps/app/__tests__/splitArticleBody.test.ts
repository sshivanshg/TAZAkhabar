import { parseArticleBlocks, splitArticleBody } from '../src/utils/splitArticleBody'

describe('splitArticleBody', () => {
  it('splits on blank lines and drops empties', () => {
    expect(splitArticleBody('One.\n\nTwo.\n\n\nThree.')).toEqual(['One.', 'Two.', 'Three.'])
    expect(splitArticleBody('')).toEqual([])
    expect(splitArticleBody(undefined)).toEqual([])
  })
})

describe('parseArticleBlocks', () => {
  it('parses paragraphs, quotes, and bullets', () => {
    const blocks = parseArticleBlocks(
      'First paragraph.\n\n> A quoted line\n\n- Alpha\n- Beta',
    )
    expect(blocks).toEqual([
      { type: 'p', text: 'First paragraph.' },
      { type: 'quote', text: 'A quoted line' },
      { type: 'ul', items: ['Alpha', 'Beta'] },
    ])
  })

  it('drops publisher download CTAs', () => {
    expect(
      parseArticleBlocks(
        'Download in high quality\n\nहाई क्वालिटी में डाउनलोड करें\n\nThe actual story.',
      ),
    ).toEqual([{ type: 'p', text: 'The actual story.' }])
  })
})
