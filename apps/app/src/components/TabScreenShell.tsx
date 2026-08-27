import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { useIsFocused } from '@react-navigation/native'
import { MotiView } from 'moti'
import { useTheme } from '../preferences/ThemePreferenceContext'
import { type AppColors } from '../theme/tokens'

type Props = {
  children: ReactNode
}

/**
 * Hides inactive tab scenes completely. Expo Router's fade/stacking on web
 * otherwise leaves Home painted over other tabs (huge "gaps" / overlap).
 * Native gets a short fade/slide so tab switches feel like Google News.
 */
export function TabScreenShell({ children }: Props) {
  const focused = useIsFocused()
  const [mounted, setMounted] = useState(focused)
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  useEffect(() => {
    if (focused) {
      setMounted(true)
      return
    }
    const delay = Platform.OS === 'web' ? 0 : 200
    const handle = setTimeout(() => setMounted(false), delay)
    return () => clearTimeout(handle)
  }, [focused])

  if (!mounted && !focused) {
    return (
      <View
        style={[styles.root, styles.hidden]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    )
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{
        opacity: focused ? 1 : 0,
        translateY: focused ? 0 : 8,
      }}
      transition={{ type: 'timing', duration: 220 }}
      style={[styles.root, focused ? styles.shown : styles.hidden]}
      accessibilityElementsHidden={!focused}
      importantForAccessibility={focused ? 'auto' : 'no-hide-descendants'}
    >
      {children}
    </MotiView>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background,
    },
    shown: {
      display: 'flex',
    },
    hidden: {
      display: 'none',
    },
  })
}
