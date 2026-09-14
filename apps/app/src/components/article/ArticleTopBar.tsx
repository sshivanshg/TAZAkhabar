import { useMemo } from 'react'
import { Platform, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ArrowLeft from 'lucide-react-native/icons/arrow-left'
import { useTheme } from '../../preferences/ThemePreferenceContext'
import { HIT_TARGET } from '../../theme/tokens'
import { iconStroke } from '../../theme/categoryIcons'
import {
  readerHeaderChrome,
  type ReaderColors,
} from '../../theme/readerTokens'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { pressableState, webFocusRing } from './focusStyle'

type Props = {
  elevated: boolean
  /** 0–1 progress through stories loaded so far (no total count shown). */
  scrollProgress: number
  onBack: () => void
}

export function ArticleTopBar({
  elevated,
  scrollProgress,
  onBack,
}: Props) {
  const insets = useSafeAreaInsets()
  const reducedMotion = usePrefersReducedMotion()
  const { readerColors } = useTheme()
  const styles = useMemo(() => createStyles(readerColors), [readerColors])
  const safeTop = Math.max(insets.top, 8)
  const progress = Math.min(1, Math.max(0, scrollProgress))

  return (
    <View
      testID="article-top-bar"
      accessibilityRole="header"
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { paddingTop: safeTop },
      ]}
    >
      <View
        style={[
          styles.shell,
          readerHeaderChrome(elevated, reducedMotion, readerColors),
        ]}
      >
        <View style={styles.row}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack}
            hitSlop={4}
            style={(state) => {
              const { pressed, focused } = pressableState(state)
              return [
                styles.back,
                pressed ? styles.pressed : null,
                webFocusRing(Boolean(focused), readerColors),
              ]
            }}
          >
            <ArrowLeft size={22} strokeWidth={iconStroke} color={readerColors.text} />
          </Pressable>

        </View>
        <View
          style={styles.track}
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: 100,
            now: Math.round(progress * 100),
          }}
        >
          <View style={[styles.fill, { width: `${progress * 100}%` }]} />
        </View>
      </View>
    </View>
  )
}

function createStyles(c: ReaderColors) {
  return StyleSheet.create({
    wrap: {
      position: Platform.OS === 'web' ? ('fixed' as 'absolute') : 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 20,
      paddingHorizontal: 12,
      paddingBottom: 10,
    },
    shell: {
      width: '100%',
      maxWidth: 760,
      alignSelf: 'center',
      overflow: 'hidden',
      borderRadius: 24,
      backgroundColor: c.headerSolid,
      ...(Platform.OS === 'web'
        ? ({
            boxShadow: '0px 10px 30px rgba(16, 24, 40, 0.10)',
          } as object)
        : {
            shadowColor: '#101828',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.08,
            shadowRadius: 16,
            elevation: 4,
          }),
    },
    row: {
      minHeight: HIT_TARGET,
      paddingHorizontal: 2,
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 8,
    },
    back: {
      width: 52,
      height: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 18,
      backgroundColor: c.headerSolid,
      borderWidth: 0,
      ...(Platform.OS === 'web'
        ? ({ boxShadow: '0px 6px 18px rgba(16, 24, 40, 0.12)' } as object)
        : {
            shadowColor: '#101828',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 10,
            elevation: 4,
          }),
    },
    pressed: {
      opacity: 0.72,
    },
    track: {
      height: 2,
      width: '100%',
      backgroundColor: 'transparent',
    },
    fill: {
      height: 2,
      backgroundColor: c.progressFill,
      opacity: 0.65,
    },
  })
}
