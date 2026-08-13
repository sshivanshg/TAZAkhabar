import { type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { useIsFocused } from '@react-navigation/native'
import { colors } from '../theme/tokens'

type Props = {
  children: ReactNode
}

/**
 * Hides inactive tab scenes completely. Expo Router's fade/stacking on web
 * otherwise leaves Home painted over Discover (huge "gaps" / overlap).
 */
export function TabScreenShell({ children }: Props) {
  const focused = useIsFocused()
  return (
    <View
      style={[styles.root, focused ? styles.shown : styles.hidden]}
      accessibilityElementsHidden={!focused}
      importantForAccessibility={focused ? 'auto' : 'no-hide-descendants'}
    >
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  shown: {
    display: 'flex',
  },
  hidden: {
    display: 'none',
  },
})
