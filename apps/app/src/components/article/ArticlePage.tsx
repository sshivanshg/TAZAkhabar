import { useMemo, useState } from 'react'
import { Platform, ScrollView, StyleSheet, View } from 'react-native'
import { useTheme } from '../../preferences/ThemePreferenceContext'
import type { getShadows } from '../../theme/tokens'

type Shadows = ReturnType<typeof getShadows>
import type { ReaderColors } from '../../theme/readerTokens'

type Props = {
  height: number
  padTop: number
  padBottom: number
  children: React.ReactNode
}

/** One viewport-tall story page so paging never shows two articles at once. */
export function ArticlePage({ height, padTop, padBottom, children }: Props) {
  const { readerColors, shadows } = useTheme()
  const styles = useMemo(() => createStyles(readerColors, shadows), [readerColors, shadows])
  const [scrollable, setScrollable] = useState(false)

  return (
    <View testID="article-page" style={[styles.page, { height }]}>
      <ScrollView
        testID="article-inner-scroll"
        style={styles.scroll}
        contentContainerStyle={{
          paddingHorizontal: 12,
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
        <View style={styles.sheet}>{children}</View>
      </ScrollView>
    </View>
  )
}

function createStyles(c: ReaderColors, sh: Shadows) {
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
    sheet: {
      flex: 1,
      width: '100%',
      maxWidth: 760,
      alignSelf: 'center',
      backgroundColor: c.card,
      borderRadius: 28,
      overflow: 'hidden',
      ...sh.floating,
    },
  })
}
