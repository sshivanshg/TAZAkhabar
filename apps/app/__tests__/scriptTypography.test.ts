import { adaptStylesForScript, scriptTracking } from '../src/theme/scriptTypography'

describe('script typography (Devanagari)', () => {
  it('zeroes any tracking in Hindi and keeps it in English', () => {
    expect(scriptTracking('hi', -0.6)).toBe(0)
    expect(scriptTracking('hi', 1.6)).toBe(0)
    expect(scriptTracking('en', -0.6)).toBe(-0.6)
  })

  it('adapts a style sheet: no tracking, no uppercase, eyebrows at least 14px', () => {
    const styles = {
      eyebrow: { fontSize: 12, lineHeight: 16, letterSpacing: 1.6, textTransform: 'uppercase' as const },
      headline: { fontSize: 28, letterSpacing: -0.6 },
      body: { fontSize: 16 },
    }
    const hi = adaptStylesForScript(styles, 'hi')
    expect(hi.eyebrow).toEqual({ fontSize: 14, lineHeight: 20, letterSpacing: 0, textTransform: 'none' })
    expect(hi.headline).toEqual({ fontSize: 28, letterSpacing: 0 })
    expect(hi.body).toBe(styles.body)
    expect(adaptStylesForScript(styles, 'en')).toBe(styles)
  })
})
