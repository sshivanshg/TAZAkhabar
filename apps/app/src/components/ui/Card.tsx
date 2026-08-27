import { type ReactNode, useMemo } from 'react'
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { useTheme } from '../../preferences/ThemePreferenceContext'
import { radius, type AppColors } from '../../theme/tokens'

type Props = {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  /** When true, clip children to radius (images, etc.) */
  clipped?: boolean
}

/**
 * Shared raised surface for list rows and grouped sections.
 * Radius matches media-forward hero cards (`radius.md`) so both card states share DNA.
 */
export function Card({ children, style, clipped = false }: Props) {
  const { colors, shadows } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View
      style={[
        styles.shadowHost,
        Platform.OS === 'web' ? styles.webBorder : shadows.card,
        style,
      ]}
    >
      <View style={[styles.inner, clipped ? styles.clipped : null]}>{children}</View>
    </View>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    shadowHost: {
      borderRadius: radius.lg,
      backgroundColor: c.surface,
      padding: 0,
    },
    webBorder: {
      borderWidth: 1,
      borderColor: c.border,
    },
    inner: {
      borderRadius: radius.lg,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    clipped: {
      overflow: 'hidden',
    },
  })
}
