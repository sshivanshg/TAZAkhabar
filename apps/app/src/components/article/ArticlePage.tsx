import { useMemo, useState } from 'react'
import { Platform, ScrollView, StyleSheet, View } from 'react-native'
import { useTheme } from '../../preferences/ThemePreferenceContext'
import type { ReaderColors } from '../../theme/readerTokens'

type Props = {
  height: number
  padTop: number
  padBottom: number
  children: React.ReactNode
}

/** One viewport-tall story page so paging never shows two articles at once. */
export function ArticlePage({
  height,
  padTop,
  padBottom,
  children,
}: Props) {
  const { readerColors } = useTheme()
  const styles = useMemo(() => createStyles(readerColors), [readerColors])
  const [scrollable, setScrollable] = useState(false)

  return (
    <View testID="article-page" style={[styles.page, { height }]}>
      <ScrollView
        testID="article-inner-scroll"
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
        {children}
      </ScrollView>
    </View>
  )
}

function createStyles(c: ReaderColors) {
  return StyleSheet.create({
    page: {
      width: '100%',
      backgroundColor: c.canvas,
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
}
