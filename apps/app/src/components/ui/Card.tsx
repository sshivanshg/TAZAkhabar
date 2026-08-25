import { type ReactNode } from 'react'
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import { colors, radius, shadows } from '../../theme/tokens'

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

const styles = StyleSheet.create({
  shadowHost: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: 0,
  },
  webBorder: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  inner: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  clipped: {
    overflow: 'hidden',
  },
})
