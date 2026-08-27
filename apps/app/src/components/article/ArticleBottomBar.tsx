import { Platform, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ARTICLE_BOTTOM_BAR_HEIGHT, readerColors } from '../../theme/readerTokens'
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

  return (
    <View
      testID="article-bottom-bar"
      style={[
        styles.wrap,
        {
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      <ArticleActions
        bookmarked={bookmarked}
        onShare={onShare}
        onSave={onSave}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    // Web: fixed to the viewport so document/list growth cannot drag the bar.
    // Native: absolute within the overflow-clipped article screen root.
    position: Platform.OS === 'web' ? ('fixed' as 'absolute') : 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    minHeight: ARTICLE_BOTTOM_BAR_HEIGHT,
    backgroundColor: readerColors.headerSolid,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: readerColors.sheetBorder,
    paddingHorizontal: 8,
    paddingTop: 4,
  },
})
