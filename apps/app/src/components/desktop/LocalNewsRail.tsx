import { useMemo } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Text } from '@gluestack-ui/themed'
import Settings2 from 'lucide-react-native/icons/settings-2'
import type { ArticleResponse } from '@tazakhabar/shared-types'
import { useTheme } from '../../preferences/ThemePreferenceContext'
import { iconStroke } from '../../theme/categoryIcons'
import { radius, RIGHT_RAIL_WIDTH, space, typography, type AppColors } from '../../theme/tokens'
import { formatRelativeTime } from '../../utils/relativeTime'
import { isHttpsUrl } from '../../utils/shareToWhatsApp'
import { SourceAvatar } from '../SourceAvatar'

type Props = {
  articles: ArticleResponse[]
  cityTitle?: string
  onPress: (article: ArticleResponse) => void
  onCityPress?: () => void
}

/** Right-rail local news list — Google News desktop sidebar. */
export function LocalNewsRail({ articles, cityTitle, onPress, onCityPress }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  if (articles.length === 0) {
    return null
  }

  return (
    <View style={styles.rail} accessibilityLabel="Local news">
      <View style={styles.header}>
        <Text style={styles.title}>Local news</Text>
        {onCityPress ? (
          <Pressable
            onPress={onCityPress}
            accessibilityRole="button"
            accessibilityLabel="Change local edition"
            hitSlop={8}
            style={({ pressed }) => [styles.settingsBtn, pressed ? styles.pressed : null]}
          >
            <Settings2 size={18} strokeWidth={iconStroke} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {cityTitle ? (
        <View style={styles.chipRow}>
          <View style={styles.chipActive}>
            <Text style={styles.chipTextActive} numberOfLines={1}>
              {cityTitle}
            </Text>
          </View>
        </View>
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {articles.map((article, index) => {
          const headline = article.headline?.trim() || 'Untitled'
          const source = article.sourceName?.trim() || 'Unknown source'
          const imageUrl =
            article.imageUrl && isHttpsUrl(article.imageUrl) ? article.imageUrl.trim() : null
          return (
            <Pressable
              key={String(article.id ?? index)}
              onPress={() => onPress(article)}
              accessibilityRole="button"
              accessibilityLabel={`${headline}. ${source}`}
              style={({ pressed }) => [
                styles.item,
                index < articles.length - 1 ? styles.itemBorder : null,
                pressed ? styles.pressed : null,
              ]}
            >
              <View style={styles.itemText}>
                <View style={styles.sourceRow}>
                  <SourceAvatar name={source} size={16} />
                  <Text style={styles.source} numberOfLines={1}>
                    {source}
                  </Text>
                </View>
                <Text style={styles.headline} numberOfLines={3}>
                  {headline}
                </Text>
                <Text style={styles.time}>{formatRelativeTime(article.publishedAt)}</Text>
              </View>
              {imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.thumb}
                  resizeMode="cover"
                  accessibilityIgnoresInvertColors
                />
              ) : null}
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    rail: {
      width: RIGHT_RAIL_WIDTH,
      flexShrink: 0,
      paddingTop: space.md,
      paddingRight: space.screen,
      paddingLeft: space.md,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: c.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: space.sm,
    },
    title: {
      fontSize: typography.headlineSm.fontSize,
      lineHeight: typography.headlineSm.lineHeight,
      fontWeight: typography.headlineSm.fontWeight,
      color: c.accent,
    },
    settingsBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.full,
    },
    chipRow: {
      flexDirection: 'row',
      gap: space.xs,
      marginBottom: space.md,
    },
    chipActive: {
      paddingHorizontal: space.md,
      paddingVertical: 6,
      borderRadius: radius.full,
      backgroundColor: c.accentSoft,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.accent,
      maxWidth: '100%',
    },
    chipTextActive: {
      fontSize: typography.chip.fontSize,
      lineHeight: typography.chip.lineHeight,
      fontWeight: '600',
      color: c.accent,
    },
    list: {
      paddingBottom: space.xxl,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: space.sm,
      paddingVertical: space.md,
    },
    itemBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    itemText: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    sourceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    source: {
      flex: 1,
      fontSize: 12,
      lineHeight: 16,
      color: c.textMuted,
    },
    headline: {
      fontSize: typography.bodySemibold.fontSize,
      lineHeight: 20,
      fontWeight: typography.bodySemibold.fontWeight,
      color: c.text,
    },
    time: {
      fontSize: typography.meta.fontSize,
      lineHeight: typography.meta.lineHeight,
      color: c.textMuted,
    },
    thumb: {
      width: 72,
      height: 72,
      borderRadius: radius.sm,
      backgroundColor: c.surfaceRaised,
      flexShrink: 0,
    },
    pressed: {
      opacity: 0.88,
    },
  })
}
