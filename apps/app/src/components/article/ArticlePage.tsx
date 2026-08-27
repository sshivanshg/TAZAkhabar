import { useState } from 'react'
import { Platform, ScrollView, StyleSheet, View } from 'react-native'
import { readerColors } from '../../theme/readerTokens'
import { StoryDivider } from './StoryDivider'

type Props = {
  height: number
  padTop: number
  padBottom: number
  showNextLabel?: boolean
  children: React.ReactNode
}

/** One viewport-tall story page so paging never shows two articles at once. */
export function ArticlePage({
  height,
  padTop,
  padBottom,
  showNextLabel = false,
  children,
}: Props) {
  const [scrollable, setScrollable] = useState(false)

  return (
    <View testID="article-page" style={[styles.page, { height }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: padTop,
          paddingBottom: padBottom,
          flexGrow: 1,
        }}
        nestedScrollEnabled
        scrollEnabled={scrollable}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        onContentSizeChange={(_, contentHeight) => {
          setScrollable(contentHeight > height + 8)
        }}
      >
        {showNextLabel ? <StoryDivider /> : null}
        {children}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    width: '100%',
    backgroundColor: readerColors.canvas,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? ({
          scrollSnapAlign: 'start',
          scrollSnapStop: 'always',
        } as object)
      : null),
  },
  scroll: {
    flex: 1,
  },
})
