import { useCallback, useMemo, useState } from 'react'
import {
  Image,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native'
import { Text } from '@gluestack-ui/themed'
import Newspaper from 'lucide-react-native/icons/newspaper'
import type { ArticleResponse } from '@tazakhabar/shared-types'
import { useTheme } from '../../preferences/ThemePreferenceContext'
import { iconStroke } from '../../theme/categoryIcons'
import { media, radius, space, typography, type AppColors } from '../../theme/tokens'
import { formatRelativeTime } from '../../utils/relativeTime'
import { isHttpsUrl } from '../../utils/shareToWhatsApp'
import { SourceAvatar } from '../SourceAvatar'

type Props = {
  articles: ArticleResponse[]
  onPress: (article: ArticleResponse) => void
  onSeeAll?: () => void
}

/**
 * Google News top-stories cluster — rounded card with lead image left and
 * related headlines stacked on the right.
 */
export function TopStoriesCluster({ articles, onPress, onSeeAll }: Props) {
  const { colors, shadows } = useTheme()
  const styles = useMemo(() => createStyles(colors, shadows.card), [colors, shadows.card])
  const [width, setWidth] = useState(0)

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width
    setWidth((prev) => (prev === next ? prev : next))
  }, [])

  if (articles.length === 0) {
    return null
  }

  const lead = articles[0]!
  const related = articles.slice(1, 4)
  const leadHeadline = lead.headline?.trim() || 'Top stories'
  const gap = space.md
  const imageWidth = related.length > 0 ? Math.round(width * 0.52) : width
  const sideWidth = related.length > 0 ? Math.max(0, width - imageWidth - gap) : 0

  return (
    <View style={styles.card} onLayout={onLayout}>
      <Pressable
        onPress={() => onPress(lead)}
        accessibilityRole="button"
        accessibilityLabel={`Top story cluster: ${leadHeadline}`}
        style={({ pressed }) => [styles.clusterTitle, pressed ? styles.pressed : null]}
      >
        <Text style={styles.clusterHeadline} numberOfLines={2}>
          {leadHeadline}
        </Text>
        <Text style={styles.chevron}>{'›'}</Text>
      </Pressable>

      <View style={styles.body}>
        <Pressable
          onPress={() => onPress(lead)}
          accessibilityRole="button"
          accessibilityLabel={leadHeadline}
          style={({ pressed }) => [
            styles.leadCol,
            related.length > 0 ? { width: imageWidth } : styles.leadSolo,
            pressed ? styles.pressed : null,
          ]}
        >
          <View style={styles.leadImageWrap}>
            {lead.imageUrl && isHttpsUrl(lead.imageUrl) ? (
              <Image
                source={{ uri: lead.imageUrl }}
                style={styles.leadImage}
                resizeMode="cover"
                accessibilityIgnoresInvertColors
              />
            ) : (
              <View style={styles.leadPlaceholder} />
            )}
          </View>
          <View style={styles.leadMeta}>
            <View style={styles.sourceRow}>
              <SourceAvatar name={lead.sourceName ?? 'Source'} size={18} />
              <Text style={styles.source} numberOfLines={1}>
                {lead.sourceName ?? 'Unknown source'}
              </Text>
            </View>
            <Text style={styles.leadTitle} numberOfLines={3}>
              {leadHeadline}
            </Text>
            <Text style={styles.time}>{formatRelativeTime(lead.publishedAt)}</Text>
          </View>
        </Pressable>

        {related.length > 0 ? (
          <View style={[styles.sideCol, { width: sideWidth }]}>
            {related.map((article, index) => {
              const headline = article.headline?.trim() || 'Untitled'
              const source = article.sourceName?.trim() || 'Unknown source'
              return (
                <Pressable
                  key={String(article.id ?? index)}
                  onPress={() => onPress(article)}
                  accessibilityRole="button"
                  accessibilityLabel={`${headline}. ${source}`}
                  style={({ pressed }) => [
                    styles.sideItem,
                    index < related.length - 1 ? styles.sideItemBorder : null,
                    pressed ? styles.pressed : null,
                  ]}
                >
                  <View style={styles.sideSourceRow}>
                    <SourceAvatar name={source} size={16} />
                    <Text style={styles.sideSource} numberOfLines={1}>
                      {source}
                    </Text>
                  </View>
                  <Text style={styles.sideHeadline} numberOfLines={3}>
                    {headline}
                  </Text>
                  <Text style={styles.time}>{formatRelativeTime(article.publishedAt)}</Text>
                </Pressable>
              )
            })}
          </View>
        ) : null}
      </View>

      {onSeeAll ? (
        <Pressable
          onPress={onSeeAll}
          accessibilityRole="button"
          accessibilityLabel="See more headlines and perspectives"
          style={({ pressed }) => [styles.footer, pressed ? styles.pressed : null]}
        >
          <Newspaper size={18} strokeWidth={iconStroke} color={colors.accent} />
          <Text style={styles.footerText}>See more headlines and perspectives</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

function createStyles(c: AppColors, cardShadow: object) {
  return StyleSheet.create({
    card: {
      marginHorizontal: space.screen,
      marginBottom: space.lg,
      borderRadius: radius.lg,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      overflow: 'hidden',
      ...cardShadow,
    },
    clusterTitle: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: space.md,
      paddingTop: space.md,
      paddingBottom: space.sm,
      gap: space.xs,
    },
    clusterHeadline: {
      flex: 1,
      fontSize: typography.headlineSm.fontSize,
      lineHeight: typography.headlineSm.lineHeight,
      fontWeight: typography.headlineSm.fontWeight,
      color: c.text,
    },
    chevron: {
      fontSize: 22,
      lineHeight: 24,
      color: c.textMuted,
      marginTop: -2,
    },
    body: {
      flexDirection: 'row',
      paddingHorizontal: space.md,
      gap: space.md,
      alignItems: 'flex-start',
    },
    leadCol: {
      flexShrink: 0,
      minWidth: 0,
    },
    leadSolo: {
      flex: 1,
      width: '100%',
    },
    leadImageWrap: {
      borderRadius: radius.md,
      overflow: 'hidden',
      height: media.heroPrimaryHeight,
      backgroundColor: c.surfaceRaised,
    },
    leadImage: {
      width: '100%',
      height: '100%',
    },
    leadPlaceholder: {
      flex: 1,
      backgroundColor: c.skeleton,
    },
    leadMeta: {
      paddingTop: space.sm,
      gap: 4,
    },
    sourceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    source: {
      flex: 1,
      fontSize: typography.meta.fontSize,
      lineHeight: typography.meta.lineHeight,
      color: c.textMuted,
    },
    leadTitle: {
      fontSize: typography.bodySemibold.fontSize,
      lineHeight: typography.bodySemibold.lineHeight,
      fontWeight: typography.bodySemibold.fontWeight,
      color: c.text,
    },
    time: {
      fontSize: typography.meta.fontSize,
      lineHeight: typography.meta.lineHeight,
      color: c.textMuted,
    },
    sideCol: {
      flexShrink: 0,
      minWidth: 0,
      paddingTop: space.xxs,
    },
    sideItem: {
      paddingVertical: space.sm,
      gap: 4,
    },
    sideItemBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    sideSourceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    sideSource: {
      flex: 1,
      fontSize: 12,
      lineHeight: 16,
      color: c.textMuted,
    },
    sideHeadline: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600',
      color: c.text,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.sm,
      paddingVertical: space.md,
      marginTop: space.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    footerText: {
      fontSize: typography.bodySemibold.fontSize,
      lineHeight: typography.bodySemibold.lineHeight,
      fontWeight: typography.bodySemibold.fontWeight,
      color: c.accent,
    },
    pressed: {
      opacity: 0.88,
    },
  })
}
