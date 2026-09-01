import { parseArticleBlocks } from '../src/utils/splitArticleBody'
import { buildArticleDisplayContent } from '../src/utils/articleContent'

describe('buildArticleDisplayContent', () => {
  it('uses summary alone when body is missing', () => {
    const content = buildArticleDisplayContent(null, 'Lead paragraph.\n\nSecond point.')
    expect(content.ledeBlocks).toHaveLength(0)
    expect(content.bodyBlocks).toHaveLength(2)
    expect(content.hasReadableContent).toBe(true)
  })

  it('shows summary as lede when body adds detail', () => {
    const content = buildArticleDisplayContent(
      'Officials said rainfall will continue through Wednesday.\n\nRescue teams were deployed overnight.',
      'Heavy rain returned to Jhansi on Tuesday morning.',
    )
    expect(content.ledeBlocks).toHaveLength(1)
    expect(content.bodyBlocks.length).toBeGreaterThanOrEqual(1)
    expect(content.hasReadableContent).toBe(true)
  })

  it('does not duplicate summary already present in body', () => {
    const summary = 'Heavy rain returned to Jhansi on Tuesday morning.'
    const content = buildArticleDisplayContent(
      `${summary}\n\nOfficials asked residents to avoid low-lying roads.`,
      summary,
    )
    expect(content.ledeBlocks).toHaveLength(0)
    expect(content.bodyBlocks.length).toBeGreaterThanOrEqual(1)
  })

  it('merges when body is much shorter than summary', () => {
    const content = buildArticleDisplayContent('Short body.', 'A much longer summary with extra context for readers.')
    const text = [...content.bodyBlocks]
      .map((block) => (block.type === 'ul' ? block.items.join(' ') : block.text))
      .join(' ')
    expect(text).toContain('much longer summary')
    expect(text).toContain('Short body.')
  })
})

describe('parseArticleBlocks integration', () => {
  it('parses multi-paragraph bodies for reader blocks', () => {
    const blocks = parseArticleBlocks('Para one.\n\nPara two.\n\nPara three.')
    expect(blocks).toHaveLength(3)
  })
})
