import { type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { isCompactNav, useBreakpoint } from '../../hooks/useBreakpoint'
import { colors, SIDEBAR_WIDTH } from '../../theme/tokens'
import { ContentRail } from './ContentRail'

type Props = {
  children: ReactNode
  sidebar?: ReactNode
}

/**
 * Root desktop chrome switch. Compact (mobile/tablet) returns children
 * with no extra layout wrapper so phone-width flex behavior is unchanged.
 * Desktop/wide keeps the sidebar + centered content rail.
 */
export function AppShell({ children, sidebar }: Props): ReactNode {
  const bp = useBreakpoint()

  if (isCompactNav(bp)) {
    return children
  }

  return (
    <View accessibilityLabel="Desktop shell" style={styles.row}>
      {sidebar ? <View style={styles.sidebar}>{sidebar}</View> : null}
      <View style={styles.main}>
        <ContentRail>{children}</ContentRail>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
  },
  main: {
    flex: 1,
  },
})
