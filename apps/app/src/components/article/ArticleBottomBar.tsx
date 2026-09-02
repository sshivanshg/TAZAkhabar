import { useMemo } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../../preferences/ThemePreferenceContext'
import { ARTICLE_BOTTOM_BAR_HEIGHT, type ReaderColors } from '../../theme/readerTokens'
import { ArticleActions } from './ArticleActions'

type Props = {
  bookmarked: boolean
  onShare: () => void
  onSave: () => void
}

export function ArticleBottomBar({
  bookmarked,
  onShare,
  onSave,
}: Props) {
  const insets = useSafeAreaInsets()
  const { readerColors } = useTheme()
  const styles = useMemo(() => createStyles(readerColors), [readerColors])

  return (
    <View
      testID="article-bottom-bar"
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      <View style={styles.shell}>
        <ArticleActions
          bookmarked={bookmarked}
          onShare={onShare}
          onSave={onSave}
        />
      </View>
    </View>
  )
}

function createStyles(c: ReaderColors) {
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
      paddingHorizontal: 12,
      paddingTop: 6,
    },
    shell: {
      width: '100%',
      maxWidth: 760,
      alignSelf: 'center',
      borderRadius: 24,
      overflow: 'hidden',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.sheetBorder,
      backgroundColor: c.headerSolid,
      ...(Platform.OS === 'web'
        ? ({
            boxShadow: '0px -10px 34px rgba(16, 24, 40, 0.12)',
          } as object)
        : {
            shadowColor: '#101828',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.08,
            shadowRadius: 20,
            elevation: 5,
          }),
    },
  })
}
