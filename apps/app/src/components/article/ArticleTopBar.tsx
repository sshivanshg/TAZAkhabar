import { useMemo } from 'react'
import { Platform, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import ArrowLeft from 'lucide-react-native/icons/arrow-left'
import { useTheme } from '../../preferences/ThemePreferenceContext'
import { useShellSidebarInset } from '../desktop/AppShell'
import type { getShadows } from '../../theme/tokens'

type Shadows = ReturnType<typeof getShadows>
import { HIT_TARGET } from '../../theme/tokens'
import { iconStroke } from '../../theme/categoryIcons'
import { readerHeaderChrome, type ReaderColors } from '../../theme/readerTokens'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { pressableState, webFocusRing } from './focusStyle'
import { useT } from '../../i18n'

type Props = {
  elevated: boolean
  /** 0–1 progress through stories loaded so far (no total count shown). */
  scrollProgress: number
  onBack: () => void
}

export function ArticleTopBar({ elevated, scrollProgress, onBack }: Props) {
  const insets = useSafeAreaInsets()
  const sidebarInset = useShellSidebarInset()
  // Desktop: a compact back pill at the column's left edge, not an empty 640px bar.
  const compact = useWindowDimensions().width >= 768
  const reducedMotion = usePrefersReducedMotion()
  const { readerColors, shadows } = useTheme()
  const t = useT()
  const styles = useMemo(() => createStyles(readerColors, shadows), [readerColors, shadows])
  const safeTop = Math.max(insets.top, 8)
  const progress = Math.min(1, Math.max(0, scrollProgress))

  return (
    <View
      testID="article-top-bar"
      accessibilityRole="header"
      pointerEvents="box-none"
      style={[styles.wrap, { paddingTop: safeTop, left: sidebarInset }]}
    >
      <View style={styles.column} pointerEvents="box-none">
        <View
          style={[
            styles.shell,
            compact ? styles.shellCompact : null,
            readerHeaderChrome(elevated, reducedMotion, readerColors),
          ]}
        >
          <View style={styles.row}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('common.goBack')}
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
    </View>
  )
}

function createStyles(c: ReaderColors, sh: Shadows) {
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
    column: {
      width: '100%',
      maxWidth: 760,
      alignSelf: 'center',
    },
    shellCompact: {
      width: 'auto',
      alignSelf: 'flex-start',
    },
    shell: {
      width: '100%',
      overflow: 'hidden',
      borderRadius: 24,
      backgroundColor: c.headerSolid,
      ...sh.floating,
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
      ...sh.floating,
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
