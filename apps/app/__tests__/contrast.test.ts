import { colors } from '../src/theme/tokens'
import { readerColors } from '../src/theme/readerTokens'

function parseColor(color: string, background = '#FFFFFF'): [number, number, number] {
  if (color.startsWith('#')) {
    const hex =
      color.length === 4
        ? color
            .slice(1)
            .split('')
            .map((char) => char + char)
            .join('')
        : color.slice(1)
    return [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16)) as [
      number,
      number,
      number,
    ]
  }

  const match = color.match(/rgba?\(([^)]+)\)/)
  if (!match) {
    throw new Error(`Unsupported color ${color}`)
  }
  const [r = 0, g = 0, b = 0, a = 1] = match[1]!
    .split(',')
    .map((part) => Number(part.trim()))
  const bg = parseColor(background)
  return [
    Math.round(r * a + bg[0] * (1 - a)),
    Math.round(g * a + bg[1] * (1 - a)),
    Math.round(b * a + bg[2] * (1 - a)),
  ]
}

function luminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((value) => {
    const channel = value / 255
    return channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

function contrast(foreground: string, background: string): number {
  const fg = luminance(parseColor(foreground, background))
  const bg = luminance(parseColor(background))
  return (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05)
}

describe('theme contrast', () => {
  const normalTextPairs = [
    ['text on background', colors.text, colors.background],
    ['text on surface', colors.text, colors.surface],
    ['secondary on background', colors.textSecondary, colors.background],
    ['secondary on surface', colors.textSecondary, colors.surface],
    ['muted on background', colors.textMuted, colors.background],
    ['muted on surface', colors.textMuted, colors.surface],
    ['selected chip text on accent', colors.textOnAccent, colors.accent],
    ['accent text on soft badge', colors.accent, colors.accentSoft],
    ['destructive text on destructive soft', colors.destructive, colors.destructiveSoft],
    ['reader text on canvas', readerColors.text, readerColors.canvas],
    ['reader muted on canvas', readerColors.textMuted, readerColors.canvas],
    ['reader secondary on canvas', readerColors.textSecondary, readerColors.canvas],
    ['reader accent on canvas', readerColors.accent, readerColors.canvas],
  ] as const

  it.each(normalTextPairs)('%s is WCAG AA for normal text', (_name, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5)
  })

  const uiPairs = [
    ['accent border/fill on accent soft', colors.accent, colors.accentSoft],
    ['destructive affordance on destructive soft', colors.destructive, colors.destructiveSoft],
  ] as const

  it.each(uiPairs)('%s is WCAG AA for UI components', (_name, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(3)
  })
})
