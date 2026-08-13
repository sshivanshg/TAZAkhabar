import { useCallback, useState, type ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Constants from 'expo-constants'
import { useFocusEffect, useRouter } from 'expo-router'
import { Text, VStack } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import { Ban, Info, Languages, MapPin, Tag } from 'lucide-react-native'
import type { CityResponse } from '@newsfeed/shared-types'
import { apiClient } from '../../src/api/client'
import { ScreenErrorBoundary } from '../../src/components/ScreenErrorBoundary'
import { TabScreenShell } from '../../src/components/TabScreenShell'
import { Card } from '../../src/components/ui/Card'
import { PrimaryButton } from '../../src/components/ui/PrimaryButton'
import { useFeedPreferences } from '../../src/preferences/FeedPreferencesContext'
import { useLanguagePreference } from '../../src/preferences/LanguagePreferenceContext'
import { READING_LANGUAGES } from '../../src/storage/languagePreference'
import { getStoredCitySlug } from '../../src/storage/cityPreference'
import { colors, HIT_TARGET, space, typography } from '../../src/theme/tokens'
import { iconStroke } from '../../src/theme/categoryIcons'
import { useTabBarClearance } from '../../src/theme/useTabBarClearance'
import { isDesktopLayout, useBreakpoint } from '../../src/hooks/useBreakpoint'

export default function ProfileScreen() {
  return (
    <ScreenErrorBoundary name="profile">
      <TabScreenShell>
        <ProfileBody />
      </TabScreenShell>
    </ScreenErrorBoundary>
  )
}

function ProfileBody() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const prefs = useFeedPreferences()
  const { preferredLanguage, setPreferredLanguage, ready: languageReady } =
    useLanguagePreference()
  const tabClearance = useTabBarClearance()
  const desktop = isDesktopLayout(useBreakpoint())
  const [cityMeta, setCityMeta] = useState<CityResponse | null>(null)
  const [citySlug, setCitySlug] = useState<string | null>(null)

  const loadCity = useCallback(async () => {
    const slug = await getStoredCitySlug()
    setCitySlug(slug)
    if (!slug) {
      setCityMeta(null)
      return
    }
    try {
      const cities = await apiClient.getCities()
      setCityMeta(cities.find((c) => c.slug === slug) ?? null)
    } catch {
      setCityMeta(null)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void loadCity()
    }, [loadCity]),
  )

  const cityTitle = cityMeta?.name ?? citySlug ?? 'Not set'
  const version =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '0.1.0'

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: 220 }}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: desktop
              ? space.md
              : Math.max(insets.top, space.xs) + space.md,
            paddingBottom: desktop
              ? space.xl
              : tabClearance + Math.max(insets.bottom, 0),
          },
        ]}
      >
        <View style={styles.pageHeader}>
          <Text
            fontSize={typography.section.fontSize}
            lineHeight={typography.section.lineHeight}
            fontWeight="$bold"
            color={colors.text}
          >
            Profile
          </Text>
          <Text
            fontSize={typography.summary.fontSize}
            lineHeight={typography.summary.lineHeight}
            color={colors.textSecondary}
            mt="$1"
          >
            City, blocks, and about
          </Text>
        </View>

        <Section title="City" Icon={MapPin}>
          <Text
            fontSize={typography.summary.fontSize}
            lineHeight={typography.summary.lineHeight}
            color={colors.textSecondary}
            mb="$3"
          >
            News is filtered for your selected city. No account is required.
          </Text>
          <Text
            fontSize={typography.headlineSm.fontSize}
            lineHeight={typography.headlineSm.lineHeight}
            fontWeight="$semibold"
            color={colors.text}
            mb="$3"
          >
            {cityTitle}
          </Text>
          <PrimaryButton
            label="Change city"
            onPress={() => router.push('/city')}
            accessibilityLabel="Change city"
            style={styles.changeCity}
          />
        </Section>

        <Section title="Reading language" Icon={Languages}>
          <Text
            fontSize={typography.summary.fontSize}
            lineHeight={typography.summary.lineHeight}
            color={colors.textSecondary}
            mb="$3"
          >
            Stories are translated on this device when the original language differs.
            Preference is saved locally.
          </Text>
          <View style={styles.langRow}>
            {READING_LANGUAGES.map((lang) => {
              const selected = languageReady && preferredLanguage === lang.code
              return (
                <Pressable
                  key={lang.code}
                  onPress={() => setPreferredLanguage(lang.code)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Prefer ${lang.label}`}
                  style={[styles.langChip, selected ? styles.langChipSelected : null]}
                >
                  <Text
                    fontSize={typography.label.fontSize}
                    lineHeight={typography.label.lineHeight}
                    fontWeight="$semibold"
                    color={selected ? colors.chipSelectedText : colors.chipInactiveText}
                  >
                    {lang.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </Section>

        <Section title="Blocked" Icon={Ban}>
          <BlockedRow
            Icon={Ban}
            label="Sources"
            count={prefs.blockedSources.length}
            empty="No sources blocked"
            items={prefs.blockedSources}
            onRemove={(name) => prefs.unblockSource(name)}
          />
          <View style={styles.spacer} />
          <BlockedRow
            Icon={Tag}
            label="Categories"
            count={prefs.blockedCategories.length}
            empty="No categories blocked"
            items={prefs.blockedCategories}
            onRemove={(name) => prefs.unblockCategory(name)}
          />
        </Section>

        <Section title="About this app" Icon={Info}>
          <Text
            fontSize={typography.summary.fontSize}
            lineHeight={24}
            color={colors.textSecondary}
          >
            NewsFeed is a local news summary you can add to your home screen. No login — pick a
            city, read short summaries, save stories on this device, and share to WhatsApp in one
            tap.
          </Text>
          <Text
            fontSize={typography.label.fontSize}
            lineHeight={typography.label.lineHeight}
            fontWeight="$medium"
            color={colors.textMuted}
            mt="$4"
          >
            Version {version}
          </Text>
        </Section>
      </ScrollView>
    </MotiView>
  )
}

function Section({
  title,
  Icon,
  children,
}: {
  title: string
  Icon: typeof MapPin
  children: ReactNode
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text
          fontSize={typography.label.fontSize}
          lineHeight={typography.label.lineHeight}
          fontWeight="$medium"
          color={colors.textMuted}
          letterSpacing={typography.label.letterSpacing}
          textTransform="uppercase"
        >
          {title}
        </Text>
      </View>
      <Card>
        <View style={styles.cardBody}>
          <View style={styles.cardTitleRow}>
            <Icon size={18} strokeWidth={iconStroke} color={colors.accent} />
            <Text
              fontSize={typography.headlineSm.fontSize}
              lineHeight={typography.headlineSm.lineHeight}
              fontWeight="$semibold"
              color={colors.text}
            >
              {title}
            </Text>
          </View>
          {children}
        </View>
      </Card>
    </View>
  )
}

function BlockedRow({
  Icon,
  label,
  count,
  empty,
  items,
  onRemove,
}: {
  Icon: typeof Ban
  label: string
  count: number
  empty: string
  items: string[]
  onRemove: (value: string) => void
}) {
  return (
    <VStack>
      <View style={styles.blockedSummary}>
        <Icon size={16} strokeWidth={iconStroke} color={colors.textSecondary} />
        <Text
          fontSize={typography.bodySemibold.fontSize}
          lineHeight={typography.bodySemibold.lineHeight}
          fontWeight="$semibold"
          color={colors.text}
          style={styles.blockedLabel}
        >
          {label}
        </Text>
        <Text
          fontSize={typography.label.fontSize}
          lineHeight={typography.label.lineHeight}
          color={colors.textMuted}
        >
          {count > 0 ? String(count) : ''}
        </Text>
      </View>
      {items.length === 0 ? (
        <Text
          fontSize={typography.summary.fontSize}
          lineHeight={typography.summary.lineHeight}
          color={colors.textMuted}
          ml="$6"
        >
          {empty}
        </Text>
      ) : (
        items.map((item) => (
          <View key={item} style={styles.prefRow}>
            <Text
              fontSize={typography.summary.fontSize}
              lineHeight={typography.summary.lineHeight}
              color={colors.textSecondary}
              style={{ flex: 1 }}
            >
              {item}
            </Text>
            <Pressable
              onPress={() => onRemove(item)}
              accessibilityRole="button"
              accessibilityLabel={`Unblock ${item}`}
              hitSlop={8}
              style={styles.unblockHit}
            >
              <Text
                fontSize={typography.meta.fontSize}
                lineHeight={typography.meta.lineHeight}
                fontWeight="$semibold"
                color={colors.text}
              >
                Unblock
              </Text>
            </Pressable>
          </View>
        ))
      )}
    </VStack>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: space.screen,
  },
  pageHeader: {
    paddingBottom: space.sm,
  },
  section: {
    marginBottom: space.xl,
  },
  sectionHeader: {
    marginBottom: space.sm,
  },
  cardBody: {
    padding: space.md,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    marginBottom: space.sm,
  },
  changeCity: {
    alignSelf: 'flex-start',
    paddingHorizontal: space.md,
  },
  langRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
  },
  langChip: {
    minHeight: HIT_TARGET - 8,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.chipInactiveBorder,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  langChipSelected: {
    backgroundColor: colors.chipSelectedBg,
    borderColor: colors.chipSelectedBg,
  },
  spacer: {
    height: space.md,
  },
  blockedSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    minHeight: HIT_TARGET - 8,
    marginBottom: space.xxs,
  },
  blockedLabel: {
    flex: 1,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: HIT_TARGET,
    gap: space.sm,
    paddingLeft: space.xl,
  },
  unblockHit: {
    minHeight: HIT_TARGET,
    minWidth: HIT_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space.xs,
  },
})
