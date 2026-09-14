import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { MotiView } from 'moti'
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg'
import { useTheme } from '../../preferences/ThemePreferenceContext'
import type { AppColors } from '../../theme/tokens'

const TICKER_ROWS = [
  { top: '12%', duration: 22000, delay: 0, opacity: 0.55 },
  { top: '28%', duration: 26000, delay: 400, opacity: 0.4 },
  { top: '62%', duration: 24000, delay: 800, opacity: 0.35 },
  { top: '78%', duration: 28000, delay: 200, opacity: 0.45 },
] as const

/** Soft newsroom atmosphere: wash, saffron pulse, drifting headline strips. */
export function NewsStartBackdrop() {
  const { colors, colorScheme } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const isDark = colorScheme === 'dark'

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="khabroWash" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={isDark ? '#1A2332' : '#DBEAFE'} stopOpacity={isDark ? 0.9 : 0.95} />
            <Stop offset="0.45" stopColor={colors.background} stopOpacity={1} />
            <Stop offset="1" stopColor={isDark ? '#202124' : '#EFF6FF'} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#khabroWash)" />
        <Circle cx="86%" cy="8%" r="120" fill="#FFB000" opacity={isDark ? 0.08 : 0.12} />
        <Circle cx="12%" cy="88%" r="160" fill={colors.accentFill} opacity={isDark ? 0.1 : 0.08} />
      </Svg>

      <MotiView
        from={{ opacity: 0.35, scale: 0.92 }}
        animate={{ opacity: isDark ? 0.22 : 0.42, scale: 1.08 }}
        transition={{ type: 'timing', duration: 3200, loop: true }}
        style={styles.saffronPulse}
      />

      {TICKER_ROWS.map((row, index) => (
        <View key={row.top} style={[styles.tickerLane, { top: row.top, opacity: row.opacity }]}>
          <MotiView
            from={{ translateX: index % 2 === 0 ? 0 : -280 }}
            animate={{ translateX: index % 2 === 0 ? -280 : 0 }}
            transition={{
              type: 'timing',
              duration: row.duration,
              delay: row.delay,
              loop: true,
            }}
            style={styles.tickerTrack}
          >
            <HeadlineStrip colors={colors} isDark={isDark} />
            <HeadlineStrip colors={colors} isDark={isDark} />
          </MotiView>
        </View>
      ))}

      <View style={styles.vignette} />
    </View>
  )
}

function HeadlineStrip({ colors, isDark }: { colors: AppColors; isDark: boolean }) {
  const bar = isDark ? 'rgba(138, 180, 248, 0.18)' : 'rgba(37, 99, 235, 0.14)'
  const accent = isDark ? 'rgba(255, 176, 0, 0.35)' : 'rgba(255, 176, 0, 0.45)'
  return (
    <View style={styles.strip}>
      <View style={[styles.liveDot, { backgroundColor: accent }]} />
      <View style={[styles.bar, { width: 72, backgroundColor: bar }]} />
      <View style={[styles.bar, { width: 118, backgroundColor: bar }]} />
      <View style={[styles.bar, { width: 54, backgroundColor: bar }]} />
      <View style={[styles.bar, { width: 96, backgroundColor: bar }]} />
      <View style={[styles.pill, { borderColor: colors.accentFill }]} />
      <View style={[styles.bar, { width: 88, backgroundColor: bar }]} />
      <View style={[styles.bar, { width: 64, backgroundColor: bar }]} />
      <View style={[styles.bar, { width: 140, backgroundColor: bar }]} />
    </View>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    saffronPulse: {
      position: 'absolute',
      top: -40,
      right: -30,
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: '#FFB000',
      opacity: 0.18,
    },
    tickerLane: {
      position: 'absolute',
      left: -40,
      right: -40,
      overflow: 'hidden',
    },
    tickerTrack: {
      flexDirection: 'row',
      gap: 28,
    },
    vignette: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.background,
      opacity: 0.12,
    },
  })
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bar: {
    height: 10,
    borderRadius: 5,
  },
  pill: {
    width: 36,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    opacity: 0.55,
  },
})
