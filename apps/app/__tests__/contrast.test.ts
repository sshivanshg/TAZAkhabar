import { colorsDark, colorsLight } from '../src/theme/tokens'
import { readerColorsDark, readerColorsLight } from '../src/theme/readerTokens'

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

function normalTextPairs(
  label: string,
  colors: typeof colorsLight,
  readerColors: typeof readerColorsLight,
) {
  return [
    [`${label} text on background`, colors.text, colors.background],
    [`${label} text on surface`, colors.text, colors.surface],
    [`${label} secondary on background`, colors.textSecondary, colors.background],
    [`${label} secondary on surface`, colors.textSecondary, colors.surface],
    [`${label} muted on background`, colors.textMuted, colors.background],
    [`${label} muted on surface`, colors.textMuted, colors.surface],
    [`${label} selected chip text on accent`, colors.chipSelectedText, colors.chipSelectedBg],
    [`${label} accent text on soft badge`, colors.accent, colors.accentSoft],
    [`${label} destructive text on destructive soft`, colors.destructive, colors.destructiveSoft],
    [`${label} reader text on canvas`, readerColors.text, readerColors.canvas],
    [`${label} reader muted on canvas`, readerColors.textMuted, readerColors.canvas],
    [`${label} reader secondary on canvas`, readerColors.textSecondary, readerColors.canvas],
    [`${label} reader accent on canvas`, readerColors.accent, readerColors.canvas],
    [`${label} reader text on card`, readerColors.text, readerColors.card],
    [`${label} reader secondary on attribution`, readerColors.textSecondary, readerColors.attribution],
    [`${label} reader accent on accent soft`, readerColors.accent, readerColors.accentSoft],
  ] as const
}

describe('theme contrast', () => {
  const pairs = [
    ...normalTextPairs('light', colorsLight, readerColorsLight),
    ...normalTextPairs('dark', colorsDark, readerColorsDark),
  ]

  it.each(pairs)('%s is WCAG AA for normal text', (_name, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5)
  })

  const uiPairs = [
    ['light accent border/fill on accent soft', colorsLight.accent, colorsLight.accentSoft],
    [
      'light destructive affordance on destructive soft',
      colorsLight.destructive,
      colorsLight.destructiveSoft,
    ],
    ['dark accent border/fill on accent soft', colorsDark.accent, colorsDark.accentSoft],
    [
      'dark destructive affordance on destructive soft',
      colorsDark.destructive,
      colorsDark.destructiveSoft,
    ],
  ] as const

  it.each(uiPairs)('%s is WCAG AA for UI components', (_name, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(3)
  })
})
