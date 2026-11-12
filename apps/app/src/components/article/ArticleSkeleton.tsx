import { useMemo, type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { MotiView } from 'moti'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { useTheme } from '../../preferences/ThemePreferenceContext'
import { ARTICLE_COLUMN_MAX, type ReaderColors } from '../../theme/readerTokens'
import { useT } from '../../i18n'

export function ArticleSkeleton() {
  const { readerColors } = useTheme()
  const t = useT()
  const styles = useMemo(() => createStyles(readerColors), [readerColors])
  const reduced = usePrefersReducedMotion()
  const Column = reduced ? View : MotiView
  const pulse = reduced
    ? {}
    : {
        from: { opacity: 0.55 },
        animate: { opacity: 1 },
        transition: { type: 'timing' as const, duration: 1100, loop: true, repeatReverse: true },
      }

  return (
    <View testID="article-skeleton" style={styles.root} accessibilityLabel={t('article.loadingNextA11y')}>
      <Column testID={reduced ? 'skeleton-static' : 'skeleton-pulse'} style={styles.column} {...pulse}>
        <View style={[styles.line, styles.cat]} />
        <View style={[styles.line, styles.title]} />
        <View style={[styles.line, styles.titleShort]} />
        <View style={[styles.line, styles.meta]} />
        <View style={[styles.line, styles.body]} />
        <View style={[styles.line, styles.body]} />
        <View style={[styles.line, styles.bodyShort]} />
      </Column>
    </View>
  )
}

/** Story content fades in over 180ms once rendered; instant under reduced motion. */
export function ContentFadeIn({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion()
  if (reduced) return <>{children}</>
  return (
    <MotiView
      style={{ flex: 1 }}
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 180 }}
    >
      {children}
    </MotiView>
  )
}

function createStyles(c: ReaderColors) {
  return StyleSheet.create({
    root: {
      width: '100%',
      maxWidth: ARTICLE_COLUMN_MAX,
      alignSelf: 'center',
      paddingBottom: 32,
    },
    column: {
      paddingHorizontal: 24,
      paddingTop: 24,
      gap: 12,
    },
    line: {
      height: 14,
      borderRadius: 6,
      backgroundColor: c.imageFallback,
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
}
