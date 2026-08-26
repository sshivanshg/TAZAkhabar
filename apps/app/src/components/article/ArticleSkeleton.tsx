import { StyleSheet, View } from 'react-native'
import { ARTICLE_COLUMN_MAX, readerColors } from '../../theme/readerTokens'

export function ArticleSkeleton() {
  return (
    <View testID="article-skeleton" style={styles.root} accessibilityLabel="Loading next story">
      <View style={styles.hero} />
      <View style={styles.column}>
        <View style={[styles.line, styles.cat]} />
        <View style={[styles.line, styles.title]} />
        <View style={[styles.line, styles.titleShort]} />
        <View style={[styles.line, styles.meta]} />
        <View style={[styles.line, styles.body]} />
        <View style={[styles.line, styles.body]} />
        <View style={[styles.line, styles.bodyShort]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    maxWidth: ARTICLE_COLUMN_MAX,
    alignSelf: 'center',
    paddingBottom: 32,
  },
  hero: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: readerColors.imageFallback,
  },
  column: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 12,
  },
  line: {
    height: 14,
    borderRadius: 6,
    backgroundColor: readerColors.imageFallback,
    opacity: 0.7,
  },
  cat: {
    width: 72,
    height: 10,
  },
  title: {
    width: '92%',
    height: 22,
  },
  titleShort: {
    width: '64%',
    height: 22,
  },
  meta: {
    width: '48%',
    height: 12,
    marginTop: 4,
  },
  body: {
    width: '100%',
    height: 12,
  },
  bodyShort: {
    width: '76%',
    height: 12,
  },
})
