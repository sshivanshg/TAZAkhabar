import { type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { CONTENT_RAIL_MAX, space } from '../../theme/tokens'

type Props = {
  children: ReactNode
}

/** Centered max-width column used as the desktop main content area. */
export function ContentRail({ children }: Props) {
  return (
    <View style={styles.outer}>
      <View style={styles.inner}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
  },
  inner: {
    maxWidth: CONTENT_RAIL_MAX,
    width: '100%',
    alignSelf: 'center',
    paddingVertical: space.xl,
    flex: 1,
  },
})
