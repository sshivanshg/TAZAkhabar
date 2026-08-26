import { type ReactNode } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { isCompactNav, useBreakpoint } from '../../hooks/useBreakpoint'
import {
  colors,
  FORCE_MOBILE_LAYOUT,
  MOBILE_STAGE_MAX_WIDTH,
  SIDEBAR_WIDTH,
} from '../../theme/tokens'
import { ContentRail } from './ContentRail'

type Props = {
  children: ReactNode
  sidebar?: ReactNode
}

/**
 * Root chrome switch.
 * - `FORCE_MOBILE_LAYOUT`: always phone UI; on web, center a phone-width stage
 *   so Mac/desktop browsers preview the mobile app cleanly.
 * - Otherwise: compact (mobile/tablet) = children as-is; desktop = sidebar + rail.
 */
export function AppShell({ children, sidebar }: Props): ReactNode {
  const bp = useBreakpoint()

  if (FORCE_MOBILE_LAYOUT) {
    if (Platform.OS === 'web') {
      return (
        <View accessibilityLabel="Mobile stage" style={styles.mobileStage}>
          <View style={styles.mobileColumn}>{children}</View>
        </View>
      )
    }
    return children
  }

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
  mobileStage: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
  },
  mobileColumn: {
    flex: 1,
    width: '100%',
    maxWidth: MOBILE_STAGE_MAX_WIDTH,
    backgroundColor: colors.background,
    // Soft edge so the phone column reads as a device frame on wide monitors.
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
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
