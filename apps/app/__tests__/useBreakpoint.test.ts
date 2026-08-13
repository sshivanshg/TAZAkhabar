import { breakpointFromWidth, isCompactNav, isDesktopLayout } from '../src/hooks/useBreakpoint'

describe('breakpointFromWidth', () => {
  it('maps boundaries', () => {
    expect(breakpointFromWidth(320)).toBe('mobile')
    expect(breakpointFromWidth(767)).toBe('mobile')
    expect(breakpointFromWidth(768)).toBe('tablet')
    expect(breakpointFromWidth(1023)).toBe('tablet')
    expect(breakpointFromWidth(1024)).toBe('desktop')
    expect(breakpointFromWidth(1439)).toBe('desktop')
    expect(breakpointFromWidth(1440)).toBe('wide')
    expect(breakpointFromWidth(1600)).toBe('wide')
  })

  it('classifies layout helpers', () => {
    expect(isDesktopLayout('desktop')).toBe(true)
    expect(isDesktopLayout('wide')).toBe(true)
    expect(isDesktopLayout('tablet')).toBe(false)
    expect(isCompactNav('mobile')).toBe(true)
    expect(isCompactNav('tablet')).toBe(true)
    expect(isCompactNav('desktop')).toBe(false)
  })
})
