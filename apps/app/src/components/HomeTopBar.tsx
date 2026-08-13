import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '@gluestack-ui/themed'
import { MapPin, Search } from 'lucide-react-native'
import { colors, HIT_TARGET, radius, space, typography } from '../theme/tokens'
import { iconStroke } from '../theme/categoryIcons'

type Props = {
  cityTitle?: string
  onCityPress: () => void
  onSearchPress: () => void
  /** When false, skip notch padding (parent already applied it, e.g. A2HS banner). */
  includeSafeArea?: boolean
}

/** Home top bar — brand + city pill left, search right. */
export function HomeTopBar({
  cityTitle,
  onCityPress,
  onSearchPress,
  includeSafeArea = true,
}: Props) {
  const insets = useSafeAreaInsets()
  const paddingTop = includeSafeArea ? Math.max(insets.top, space.xxs) : space.xxs

  return (
    <View style={[styles.bar, { paddingTop }]}>
      <View style={styles.left} accessibilityRole="header">
        <Text
          fontSize={typography.section.fontSize}
          lineHeight={typography.section.lineHeight}
          fontWeight="$bold"
          color={colors.text}
          numberOfLines={1}
        >
          NewsFeed
        </Text>
        {cityTitle ? (
          <Pressable
            onPress={onCityPress}
            accessibilityRole="button"
            accessibilityLabel={`Change city, currently ${cityTitle}`}
            hitSlop={4}
            style={({ pressed }) => [styles.cityPill, pressed ? styles.cityPressed : null]}
          >
            <MapPin size={12} strokeWidth={iconStroke} color={colors.accent} />
            <Text
              fontSize={typography.label.fontSize}
              lineHeight={typography.label.lineHeight}
              fontWeight="$medium"
              color={colors.accent}
              numberOfLines={1}
            >
              {cityTitle}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable
        onPress={onSearchPress}
        accessibilityRole="button"
        accessibilityLabel="Search and discover"
        hitSlop={8}
        style={({ pressed }) => [styles.searchHit, pressed ? styles.searchPressed : null]}
      >
        <View style={styles.searchCircle}>
          <Search size={18} strokeWidth={iconStroke} color={colors.text} />
        </View>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    minHeight: HIT_TARGET,
    paddingBottom: space.xs,
    paddingHorizontal: space.screen,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    flexGrow: 0,
    flexShrink: 0,
    gap: space.sm,
  },
  left: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: space.xxs + 2,
    paddingTop: space.xxs,
  },
  cityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xxs,
    paddingHorizontal: space.xs + 2,
    paddingVertical: space.xxs + 2,
    minHeight: 28,
    borderRadius: radius.full,
    backgroundColor: colors.accentSoft,
    maxWidth: '100%',
  },
  cityPressed: {
    opacity: 0.85,
  },
  searchHit: {
    width: HIT_TARGET,
    height: HIT_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  searchPressed: {
    opacity: 0.85,
  },
})
