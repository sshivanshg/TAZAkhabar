import { useMemo } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../preferences/ThemePreferenceContext'
import { useShellSidebarInset } from '../desktop/AppShell'
import type { getShadows } from '../../theme/tokens'

type Shadows = ReturnType<typeof getShadows>
import { ARTICLE_BOTTOM_BAR_HEIGHT, type ReaderColors } from '../../theme/readerTokens'
import { ArticleActions } from './ArticleActions'
import { LanguageSegment } from './LanguageSegment'
import type { ReadingLanguageCode } from '../../storage/languagePreference'

type Props = {
  bookmarked: boolean
  onShare: () => void
  onSave: () => void
  onBack?: () => void
  language?: ReadingLanguageCode
  onLanguageChange?: (code: ReadingLanguageCode) => void
}

/**
 * Thumb-zone article bar: Back to news · EN|हि · Save · WhatsApp (primary).
 * Every target is >= 44px and the row fits a 360px-wide phone.
 */
export function ArticleBottomBar({
  bookmarked,
  onShare,
  onSave,
  onBack,
  language,
  onLanguageChange,
}: Props) {
  const insets = useSafeAreaInsets()
  const sidebarInset = useShellSidebarInset()
  const { readerColors, shadows } = useTheme()
  const styles = useMemo(() => createStyles(readerColors, shadows), [readerColors, shadows])

  return (
    <View
      testID="article-bottom-bar"
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          paddingBottom: Math.max(insets.bottom, 8),
          left: sidebarInset,
        },
      ]}
    >
      <View style={styles.shell}>
        <ArticleActions
          bookmarked={bookmarked}
          onShare={onShare}
          onSave={onSave}
          onBack={onBack}
          languageSlot={
            language && onLanguageChange ? (
              <LanguageSegment value={language} onChange={onLanguageChange} />
            ) : undefined
          }
        />
      </View>
    </View>
  )
}

function createStyles(c: ReaderColors, sh: Shadows) {
  return StyleSheet.create({
    wrap: {
      // Web: fixed to the viewport so document/list growth cannot drag the bar.
      // Native: absolute within the overflow-clipped article screen root.
      position: Platform.OS === 'web' ? ('fixed' as 'absolute') : 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 20,
      minHeight: ARTICLE_BOTTOM_BAR_HEIGHT,
      // Fix 11: anchored flush to the viewport edge with a solid surface, so
      // content never shows through or around a floating pill.
      paddingTop: 6,
      backgroundColor: c.headerSolid,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.sheetBorder,
      ...sh.floating,
    },
    shell: {
      width: '100%',
      maxWidth: 760,
      alignSelf: 'center',
      paddingHorizontal: 8,
      backgroundColor: c.headerSolid,
    },
  })
}
