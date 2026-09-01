import { useWindowDimensions } from 'react-native'
import { breakpoints } from '../theme/tokens'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'wide'

export function breakpointFromWidth(width: number): Breakpoint {
  if (width >= breakpoints.wide) return 'wide'
  if (width >= breakpoints.desktop) return 'desktop'
  if (width >= breakpoints.tablet) return 'tablet'
  return 'mobile'
}

export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions()
  return breakpointFromWidth(width)
}

export function isDesktopLayout(bp: Breakpoint): boolean {
  return bp === 'desktop' || bp === 'wide'
}

/** Tablet, desktop, and wide — Google News–style expanded chrome (not phone). */
export function isExpandedLayout(bp: Breakpoint): boolean {
  return bp !== 'mobile'
}

/** Bottom tab bar — phone only; tablet+ uses top navigation. */
export function isCompactNav(bp: Breakpoint): boolean {
  return bp === 'mobile'
}
