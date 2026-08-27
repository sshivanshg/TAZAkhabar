import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ArrowLeft from 'lucide-react-native/icons/arrow-left'
import { HIT_TARGET } from '../../theme/tokens'
import { iconStroke } from '../../theme/categoryIcons'
import {
  readerColors,
  readerHeaderChrome,
} from '../../theme/readerTokens'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { LanguageSegment } from './LanguageSegment'
import { pressableState, webFocusRing } from './focusStyle'
import type { ReadingLanguageCode } from '../../storage/languagePreference'

type Props = {
  elevated: boolean
  position: number
  total: number
  readingLanguage: ReadingLanguageCode
  onSelectLanguage: (code: ReadingLanguageCode) => void
  onBack: () => void
}

export function ArticleTopBar({
  elevated,
  position,
  total,
  readingLanguage,
  onSelectLanguage,
  onBack,
}: Props) {
  const insets = useSafeAreaInsets()
  const reducedMotion = usePrefersReducedMotion()
  const breakpoint = useBreakpoint()
  const showBackLabel = breakpoint === 'desktop' || breakpoint === 'wide'
  const safeTop = Math.max(insets.top, 8)
  const progress = total > 0 ? Math.min(1, Math.max(0, position / total)) : 0

  return (
    <View
      testID="article-top-bar"
      accessibilityRole="header"
      style={[
        styles.wrap,
        { paddingTop: safeTop },
        readerHeaderChrome(elevated, reducedMotion),
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
              webFocusRing(Boolean(focused)),
            ]
          }}
        >
          <ArrowLeft size={22} strokeWidth={iconStroke} color={readerColors.text} />
          {showBackLabel ? <Text style={styles.backLabel}>Back</Text> : null}
        </Pressable>

        <LanguageSegment value={readingLanguage} onChange={onSelectLanguage} />

        <Text
          style={styles.progressLabel}
          accessibilityLabel={`Story ${position} of ${total}`}
        >
          {position} of {total}
        </Text>
      </View>
      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: total, now: position }}
      >
        <View style={[styles.fill, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    position: Platform.OS === 'web' ? ('fixed' as 'absolute') : 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  row: {
    minHeight: HIT_TARGET,
    paddingHorizontal: 16,
    paddingBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  back: {
    minWidth: HIT_TARGET,
    minHeight: HIT_TARGET,
    paddingLeft: 4,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
  },
  backLabel: {
    color: readerColors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.72,
  },
  progressLabel: {
    minWidth: 58,
    textAlign: 'right',
    color: readerColors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 2,
    backgroundColor: readerColors.progressTrack,
  },
  fill: {
    height: 2,
    backgroundColor: readerColors.progressFill,
    opacity: 0.45,
  },
})
