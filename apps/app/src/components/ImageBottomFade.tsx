import { StyleSheet, View } from 'react-native'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'
import { colors } from '../theme/tokens'

let fadeId = 0

type Props = {
  height?: number
  /** Max opacity at the bottom of the gradient (default 0.75). */
  peakOpacity?: number
}

/** Dark gradient at the bottom of a photo for overlay text legibility. */
export function ImageBottomFade({ height = 72, peakOpacity = 0.75 }: Props) {
  const id = `imageBottomFade-${++fadeId}`
  return (
    <View style={[styles.wrap, { height }]} accessibilityElementsHidden>
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.imageFade} stopOpacity="0" />
            <Stop offset="0.55" stopColor={colors.imageFade} stopOpacity={String(peakOpacity * 0.55)} />
            <Stop offset="1" stopColor={colors.imageFade} stopOpacity={String(peakOpacity)} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
})
