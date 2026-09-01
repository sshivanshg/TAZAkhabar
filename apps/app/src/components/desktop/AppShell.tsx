import { useMemo, type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { isExpandedLayout, useBreakpoint } from '../../hooks/useBreakpoint'
import { useTheme } from '../../preferences/ThemePreferenceContext'
import { type AppColors } from '../../theme/tokens'
import { ContentRail } from './ContentRail'

type Props = {
  children: ReactNode
  sidebar?: ReactNode
}

/**
 * Root layout switch. Phone returns children unchanged.
 * Tablet+ uses a centered wide content rail (Google News — no left sidebar).
 */
export function AppShell({ children }: Props): ReactNode {
  const bp = useBreakpoint()
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  if (!isExpandedLayout(bp)) {
    return children
  }

  return (
    <View accessibilityLabel="Expanded shell" style={styles.root}>
      <ContentRail>{children}</ContentRail>
    </View>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background,
    },
  })
}
