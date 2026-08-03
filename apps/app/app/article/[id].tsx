import { useMemo, useRef, useState } from 'react'
import {
  Animated,
  Linking,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Image, Text } from '@gluestack-ui/themed'
import { ImageBottomFade } from '../../src/components/ImageBottomFade'
import { ScreenErrorBoundary } from '../../src/components/ScreenErrorBoundary'
import {
  colors,
  media,
  radius,
  space,
  typography,
} from '../../src/theme/tokens'
import { formatRelativeTime } from '../../src/utils/relativeTime'

/** Stub article detail — full reader comes later. */
export default function ArticleStubScreen() {
  return (
    <ScreenErrorBoundary name="article">
      <ArticleStubBody />
    </ScreenErrorBoundary>
  )
}

function ArticleStubBody() {
  const router = useRouter()
  const { width: windowWidth } = useWindowDimensions()
  const params = useLocalSearchParams<{
    id?: string
    headline?: string
    summary?: string
    sourceName?: string
    sourceUrl?: string
    imageUrl?: string
    publishedAt?: string
  }>()

  const headline = params.headline || 'Article'
  const summary = params.summary || 'Full article view is not available yet.'
  const sourceName = params.sourceName || 'Source'
  const sourceUrl = params.sourceUrl
  const imageUrl = params.imageUrl
  const relative = formatRelativeTime(params.publishedAt)

  const scrollY = useRef(new Animated.Value(0)).current
  const [contentHeight, setContentHeight] = useState(1)
  const [layoutHeight, setLayoutHeight] = useState(1)

  const progressWidth = useMemo(() => {
    const maxScroll = Math.max(contentHeight - layoutHeight, 1)
    return scrollY.interpolate({
      inputRange: [0, maxScroll],
      outputRange: [0, windowWidth],
      extrapolate: 'clamp',
    })
  }, [scrollY, contentHeight, layoutHeight, windowWidth])

  const onScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: false,
      }),
    [scrollY],
  )

  return (
    <View style={styles.root}>
      <View style={styles.progressTrack} accessibilityLabel="Reading progress">
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        onScroll={onScroll}
        onLayout={(e) => setLayoutHeight(e.nativeEvent.layout.height)}
        onContentSizeChange={(_w, h) => setContentHeight(h)}
      >
        {imageUrl ? (
          <View style={styles.heroWrap}>
            <Image
              source={{ uri: imageUrl }}
              alt=""
              w="$full"
              h={media.articleHeroHeight}
              resizeMode="cover"
            />
            <ImageBottomFade height={96} />
          </View>
        ) : null}

        <View style={[styles.body, !imageUrl ? styles.bodyNoImage : null]}>
          <Text
            fontSize={26}
            lineHeight={34}
            fontWeight="$bold"
            color={colors.text}
            letterSpacing={-0.3}
          >
            {headline}
          </Text>

          <Text
            fontSize={typography.meta.fontSize}
            lineHeight={typography.meta.lineHeight}
            letterSpacing={typography.meta.letterSpacing}
            fontWeight="$medium"
            color={colors.textMuted}
            textTransform="uppercase"
            style={styles.meta}
          >
            {sourceName}
            {relative ? `  ·  ${relative}` : ''}
          </Text>

          <Text
            fontSize={typography.summary.fontSize}
            lineHeight={Math.round(typography.summary.lineHeight * 1.05)}
            color={colors.textSecondary}
            style={styles.summary}
          >
            {summary}
          </Text>

          <Text fontSize={15} lineHeight={22} color={colors.textMuted} style={styles.note}>
            Full in-app reader coming later. You can open the original source for now.
          </Text>

          {sourceUrl ? (
            <Pressable
              onPress={() => void Linking.openURL(sourceUrl)}
              accessibilityRole="button"
              accessibilityLabel="Open original source"
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed ? styles.primaryPressed : null,
              ]}
            >
              <Text
                fontSize={typography.button.fontSize}
                lineHeight={typography.button.lineHeight}
                fontWeight="$semibold"
                color={colors.textOnAccent}
              >
                Open original source
              </Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back to feed"
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed ? styles.secondaryPressed : null,
            ]}
          >
            <Text
              fontSize={typography.button.fontSize}
              lineHeight={typography.button.lineHeight}
              fontWeight="$semibold"
              color={colors.textSecondary}
            >
              Back to feed
            </Text>
          </Pressable>
        </View>
      </Animated.ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressTrack: {
    height: 3,
    width: '100%',
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: space.xxl,
  },
  heroWrap: {
    width: '100%',
    height: media.articleHeroHeight,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  body: {
    paddingHorizontal: space.md,
    paddingTop: space.md,
  },
  bodyNoImage: {
    paddingTop: space.xl,
  },
  meta: {
    marginTop: space.xs,
  },
  summary: {
    marginTop: space.md,
  },
  note: {
    marginTop: space.lg,
    marginBottom: space.md,
  },
  primaryBtn: {
    minHeight: 52,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
    marginBottom: space.sm,
  },
  primaryPressed: {
    backgroundColor: colors.accentPressed,
  },
  secondaryBtn: {
    minHeight: 52,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.chipInactiveBorder,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  secondaryPressed: {
    backgroundColor: colors.surfaceRaised,
  },
})
