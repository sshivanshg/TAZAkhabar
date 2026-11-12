import { useMemo, type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { usePathname } from 'expo-router'
import { isExpandedLayout, useBreakpoint } from '../../hooks/useBreakpoint'
import { useTheme } from '../../preferences/ThemePreferenceContext'
import { SIDEBAR_WIDTH, type AppColors } from '../../theme/tokens'
import { ContentRail } from './ContentRail'
import { DesktopSidebar } from './DesktopSidebar'

export { SIDEBAR_WIDTH }

/**
 * Left offset for viewport-fixed chrome (article top/bottom bars) so it lines
 * up with the content column instead of sliding under the sidebar.
 */
export function useShellSidebarInset(): number {
  const bp = useBreakpoint()
  const pathname = usePathname()
  return isExpandedLayout(bp) && !BARE_ROUTES.has(pathname) ? SIDEBAR_WIDTH : 0
}

type Props = {
  children: ReactNode
}

/** Onboarding routes render full-bleed, without the navigation sidebar. */
const BARE_ROUTES = new Set(['/language'])

/**
 * Root layout switch. Phone returns children unchanged.
 * Tablet+ (>=768px) is the shared desktop shell for every route: a fixed left
 * DesktopSidebar (Home / Bookmarks / Profile, footer links) next to a centred
 * content rail. Screens never render their own sidebar.
 */
export function AppShell({ children }: Props): ReactNode {
  const bp = useBreakpoint()
  const pathname = usePathname()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  if (!isExpandedLayout(bp) || BARE_ROUTES.has(pathname)) {
    return children
  }

  return (
    <View accessibilityLabel="Expanded shell" style={styles.root}>
      <View style={styles.sidebar} testID="desktop-shell-sidebar">
        <DesktopSidebar />
      </View>
      <View style={styles.main}>
        <ContentRail>{children}</ContentRail>
      </View>
    </View>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: c.background,
    },
    sidebar: {
      width: SIDEBAR_WIDTH,
      flexShrink: 0,
    },
    main: {
      flex: 1,
      minWidth: 0,
    },
  })
}
