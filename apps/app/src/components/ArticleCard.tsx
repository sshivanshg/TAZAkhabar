import { StyleSheet, View } from 'react-native'
import { Box, HStack, Image, Text, VStack } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import { MotiPressable } from 'moti/interactions'
import type { ArticleResponse } from '@newsfeed/shared-types'
import { colors, media, radius, shadows, space, typography } from '../theme/tokens'
import { formatRelativeTime } from '../utils/relativeTime'
import { CategoryPill } from './CategoryPill'
import { ImageBottomFade } from './ImageBottomFade'

type Props = {
  article: ArticleResponse
  index: number
  onPress: (article: ArticleResponse) => void
  onLongPress?: (article: ArticleResponse) => void
}

/** Full-width story card — kept for detail previews / legacy call sites. */
export function ArticleCard({ article, index, onPress, onLongPress }: Props) {
  const headline = article.headline ?? 'Untitled'
  const summary = article.summary ?? ''
  const source = article.sourceName ?? 'Unknown source'
  const relative = formatRelativeTime(article.publishedAt)
  const category = article.category
  const imageUrl = article.imageUrl

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 260, delay: Math.min(index * 45, 270) }}
      style={{ marginBottom: space.sm + 2 }}
    >
      <MotiPressable
        onPress={() => onPress(article)}
        onLongPress={onLongPress ? () => onLongPress(article) : undefined}
        accessibilityRole="button"
        accessibilityLabel={`${headline}. ${source}. ${relative}. Long press for options.`}
        animate={({ pressed }) => {
          'worklet'
          return {
            scale: pressed ? 0.985 : 1,
            opacity: pressed ? 0.94 : 1,
          }
        }}
        transition={{ type: 'timing', duration: 140 }}
        style={[
          {
            backgroundColor: colors.surface,
            borderRadius: radius.lg,
            overflow: 'hidden',
          },
          shadows.card,
        ]}
      >
        {imageUrl ? (
          <View style={styles.imageWrap}>
            <Image
              source={{ uri: imageUrl }}
              alt=""
              w="$full"
              h={media.cardImageHeight}
              resizeMode="cover"
            />
            <ImageBottomFade />
            {category ? (
              <View style={styles.pillWrap}>
                <CategoryPill label={category} variant="filled" />
              </View>
            ) : null}
          </View>
        ) : null}
        <VStack space="sm" px="$4" pt={imageUrl ? '$3' : '$4'} pb="$4">
          {!imageUrl && category ? <CategoryPill label={category} variant="soft" /> : null}
          <Text
            fontSize={typography.headline.fontSize}
            lineHeight={typography.headline.lineHeight}
            fontWeight="$bold"
            color={colors.text}
            letterSpacing={-0.2}
          >
            {headline}
          </Text>
          {summary ? (
            <Text
              fontSize={typography.summary.fontSize}
              lineHeight={typography.summary.lineHeight}
              color={colors.textSecondary}
              numberOfLines={3}
            >
              {summary}
            </Text>
          ) : null}
          <HStack space="sm" alignItems="center" flexWrap="wrap" mt="$1">
            <Text
              fontSize={typography.meta.fontSize}
              lineHeight={typography.meta.lineHeight}
              fontWeight="$medium"
              color={colors.textMuted}
            >
              {source}
            </Text>
            {relative ? (
              <Text
                fontSize={typography.meta.fontSize}
                lineHeight={typography.meta.lineHeight}
                color={colors.textMuted}
              >
                · {relative}
              </Text>
            ) : null}
          </HStack>
        </VStack>
      </MotiPressable>
    </MotiView>
  )
}

export function ArticleCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <MotiView
      from={{ opacity: 0.4 }}
      animate={{ opacity: 0.85 }}
      transition={{
        type: 'timing',
        duration: 780,
        loop: true,
        delay: index * 80,
      }}
      style={{ marginBottom: space.sm + 2 }}
    >
      <Box bg={colors.surface} borderRadius={radius.lg} overflow="hidden" style={shadows.card}>
        <Box h={media.cardImageHeight} bg={colors.skeleton} />
        <VStack space="sm" p="$4">
          <Box h={22} w="92%" bg={colors.skeleton} borderRadius={radius.xs} />
          <Box h={16} w="100%" bg={colors.skeleton} borderRadius={radius.xs} />
          <Box h={16} w="78%" bg={colors.skeleton} borderRadius={radius.xs} />
          <Box h={12} w="36%" bg={colors.skeleton} borderRadius={radius.xs} mt="$1" />
        </VStack>
      </Box>
    </MotiView>
  )
}

const styles = StyleSheet.create({
  imageWrap: {
    width: '100%',
    height: media.cardImageHeight,
    position: 'relative',
    backgroundColor: colors.surfaceRaised,
    overflow: 'hidden',
  },
  pillWrap: {
    position: 'absolute',
    top: space.sm,
    left: space.sm,
    zIndex: 2,
  },
})
