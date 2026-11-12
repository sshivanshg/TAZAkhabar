import { useMemo } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { Text } from '@gluestack-ui/themed'
import Ellipsis from 'lucide-react-native/icons/ellipsis'
import type { ArticleResponse } from '@tazakhabar/shared-types'
import { useTheme } from '../preferences/ThemePreferenceContext'
import { HIT_TARGET, radius, space, typography, type AppColors } from '../theme/tokens'
import { iconStroke } from '../theme/categoryIcons'
import { formatRelativeTime } from '../utils/relativeTime'
import { SourceAvatar } from './SourceAvatar'
import { cleanHeadline } from '../lib/headline'
import { useT } from '../i18n'
import { adaptStylesForScript } from '../theme/scriptTypography'
import { useAppLanguage } from '../i18n'

type Props = {
  articles: ArticleResponse[]
  onPress: (article: ArticleResponse) => void
  onMorePress?: (article: ArticleResponse) => void
}

const CARD_WIDTH = 220

/** Horizontal related-story strip under a featured card (Google News cluster). */
export function RelatedStoriesStrip({ articles, onPress, onMorePress }: Props) {
  const { colors } = useTheme()
  const t = useT()
  const scriptLang = useAppLanguage()
  const styles = useMemo(
    () => adaptStylesForScript(createStyles(colors), scriptLang),
    [colors, scriptLang],
  )

  if (articles.length === 0) {
    return null
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      decelerationRate="fast"
      snapToInterval={CARD_WIDTH + space.sm}
      snapToAlignment="start"
      contentContainerStyle={styles.row}
    >
      {articles.map((article) => {
        const headline = cleanHeadline(article.headline ?? '', article.sourceName) || 'Untitled'
        const source = article.sourceName?.trim() || t('common.unknownSource')
        const relative = formatRelativeTime(article.publishedAt)
        return (
          <View key={String(article.id ?? headline)} style={styles.cardWrap}>
            <Pressable
              onPress={() => onPress(article)}
              onLongPress={onMorePress ? () => onMorePress(article) : undefined}
              delayLongPress={380}
              accessibilityRole="button"
              accessibilityLabel={`${headline}. ${source}. ${relative}`}
              style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
            >
              <View style={styles.sourceRow}>
                <SourceAvatar name={source} size={18} />
                <Text style={styles.source} numberOfLines={1}>
                  {source}
                </Text>
              </View>
              <Text style={styles.headline} numberOfLines={4}>
                {headline}
              </Text>
              {relative ? (
                <Text style={styles.meta} numberOfLines={1}>
                  {relative}
                </Text>
              ) : null}
            </Pressable>
            {/* Overflow is a sibling of the card Pressable: no nested <button> on web. */}
            {onMorePress ? (
              <Pressable
                onPress={() => onMorePress(article)}
                accessibilityRole="button"
                accessibilityLabel={t('common.moreOptionsFor', { headline })}
                hitSlop={0}
                style={({ pressed }) => [styles.more, pressed ? styles.morePressed : null]}
              >
                <Ellipsis size={16} strokeWidth={iconStroke} color={colors.textSecondary} />
              </Pressable>
            ) : null}
          </View>
        )
      })}
    </ScrollView>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    row: {
      paddingHorizontal: space.screen,
      paddingTop: space.xs,
      paddingBottom: space.md,
      gap: space.sm,
    },
    card: {
      width: CARD_WIDTH,
      minHeight: 148,
      padding: space.sm,
      borderRadius: radius.lg,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      gap: 8,
    },
    pressed: {
      opacity: 0.92,
      transform: [{ scale: 0.985 }],
    },
    sourceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingRight: HIT_TARGET - space.sm,
    },
    cardWrap: {
      position: 'relative',
    },
    source: {
      flex: 1,
      minWidth: 0,
      color: c.textMuted,
      fontSize: typography.label.fontSize,
      lineHeight: typography.label.lineHeight,
      fontWeight: '600',
    },
    headline: {
      color: c.text,
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '700',
      letterSpacing: -0.2,
      flexGrow: 1,
    },
    meta: {
      color: c.textMuted,
      fontSize: typography.label.fontSize,
      lineHeight: typography.label.lineHeight,
      fontWeight: '500',
    },
    more: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: HIT_TARGET,
      height: HIT_TARGET,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.full,
    },
    morePressed: {
      backgroundColor: c.surfaceRaised,
    },
  })
}
