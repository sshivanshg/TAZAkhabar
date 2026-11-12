import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Constants from 'expo-constants'
import { useFocusEffect, useRouter } from 'expo-router'
import { Box, Text, VStack } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import Ban from 'lucide-react-native/icons/ban'
import Info from 'lucide-react-native/icons/info'
import Languages from 'lucide-react-native/icons/languages'
import Mail from 'lucide-react-native/icons/mail'
import MapPin from 'lucide-react-native/icons/map-pin'
import Moon from 'lucide-react-native/icons/moon'
import BellRing from 'lucide-react-native/icons/bell-ring'
import Tag from 'lucide-react-native/icons/tag'
import ChevronRight from 'lucide-react-native/icons/chevron-right'
import type { CityResponse } from '@tazakhabar/shared-types'
import { apiClient } from '../../src/api/client'
import { ScreenErrorBoundary } from '../../src/components/ScreenErrorBoundary'
import { TabScreenShell } from '../../src/components/TabScreenShell'
import { Card } from '../../src/components/ui/Card'
import { PrimaryButton, SecondaryButton } from '../../src/components/ui/PrimaryButton'
import { PublicLinks } from '../../src/components/PublicLinks'
import { useFeedPreferences } from '../../src/preferences/FeedPreferencesContext'
import { useLanguagePreference } from '../../src/preferences/LanguagePreferenceContext'
import { useTheme } from '../../src/preferences/ThemePreferenceContext'
import {
  registerNewsNotifications,
  suppressNotificationPrompt,
} from '../../src/notifications/registerNotifications'
import {
  getNotificationPromptState,
  getNotificationPlatform,
  getOrCreateNotificationClientId,
} from '../../src/storage/notificationPreferences'
import { READING_LANGUAGES } from '../../src/storage/languagePreference'
import { type ThemePreference } from '../../src/storage/themePreference'
import {
  getCityDisplayLabel,
  getStoredCitySlug,
  GLOBAL_CITY_SLUG,
} from '../../src/storage/cityPreference'
import { HIT_TARGET, space, typography, type AppColors } from '../../src/theme/tokens'
import { iconStroke } from '../../src/theme/categoryIcons'
import { useTabBarClearance } from '../../src/theme/useTabBarClearance'
import { isDesktopLayout, useBreakpoint } from '../../src/hooks/useBreakpoint'
import { translate, useT } from '../../src/i18n'


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
  const { preferredLanguage, setPreferredLanguage, ready: languageReady } = useLanguagePreference()
  const {
    colors,
    preference: themePreference,
    setPreference: setThemePreference,
    colorScheme,
    ready: themeReady,
  } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const tabClearance = useTabBarClearance()
  const t = useT()
  const schemeLabel = t(colorScheme === 'dark' ? 'settings.schemeDark' : 'settings.schemeLight')
  const desktop = isDesktopLayout(useBreakpoint())
  const [cityMeta, setCityMeta] = useState<CityResponse | null>(null)
  const [citySlug, setCitySlug] = useState<string | null>(null)
  const [notificationStatus, setNotificationStatus] = useState<
    'unknown' | 'granted' | 'denied' | 'dismissed'
  >('unknown')
  const [notificationBusy, setNotificationBusy] = useState(false)
  const [notificationError, setNotificationError] = useState<string | null>(null)

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

  const loadNotificationState = useCallback(async () => {
    const state = await getNotificationPromptState()
    setNotificationStatus(state.status)
    setNotificationError(null)
  }, [])

  useFocusEffect(
    useCallback(() => {
      void loadCity()
      void loadNotificationState()
    }, [loadCity, loadNotificationState]),
  )

  const cityTitle = getCityDisplayLabel(citySlug ?? GLOBAL_CITY_SLUG, cityMeta?.name)
  const version = Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '0.1.0'

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
            paddingTop: desktop ? space.md : Math.max(insets.top, space.xs) + space.md,
            paddingBottom: desktop ? space.xl : tabClearance + Math.max(insets.bottom, 0),
          },
        ]}
      >
        <View style={styles.pageHeader}>
          <Text
            fontSize={24}
            lineHeight={30}
            fontWeight="$bold"
            color={colors.text}
            accessibilityRole="header"
          >
            {t('settings.title')}
          </Text>
          <Text
            fontSize={typography.summary.fontSize}
            lineHeight={typography.summary.lineHeight}
            color={colors.textSecondary}
            mt="$1"
          >
            {t('settings.subtitle')}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.welcomeCard, pressed && styles.welcomePressed]}
          onPress={() => router.push('/city')}
          accessibilityRole="button"
          accessibilityLabel={t('settings.changeCityFrom', { city: cityTitle })}
        >
          <View style={styles.welcomeIcon}>
            <MapPin size={22} color={colors.textOnAccent} strokeWidth={2.2} />
          </View>
          <View style={styles.welcomeCopy}>
            <Text style={styles.welcomeTitle}>{cityTitle}</Text>
            <Text style={styles.welcomeSubtitle}>{t('settings.localEdition')}</Text>
          </View>
          <ChevronRight size={22} color={colors.textOnAccent} />
        </Pressable>

        <Section title={t('settings.appearance')} Icon={Moon}>
          <Text
            fontSize={typography.summary.fontSize}
            lineHeight={typography.summary.lineHeight}
            color={colors.textSecondary}
            mb="$3"
          >
            {t('settings.appearanceHint')}
          </Text>
          <View style={styles.langRow}>
            {(
              [
                { value: 'light' as const, label: t('settings.themeLight') },
                { value: 'dark' as const, label: t('settings.themeDark') },
                { value: 'system' as const, label: t('settings.themeSystem') },
              ] satisfies { value: ThemePreference; label: string }[]
            ).map((option) => {
              const selected = themeReady && themePreference === option.value
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setThemePreference(option.value)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={
                    option.value === 'system'
                      ? t('settings.appearanceSystemA11y', { scheme: schemeLabel })
                      : t('settings.appearanceA11y', { option: option.label })
                  }
                  style={[styles.langChip, selected ? styles.langChipSelected : null]}
                >
                  <Text
                    fontSize={typography.label.fontSize}
                    lineHeight={typography.label.lineHeight}
                    fontWeight="$semibold"
                    color={selected ? colors.chipSelectedText : colors.text}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
          {themeReady && themePreference === 'system' ? (
            <Text
              fontSize={typography.meta.fontSize}
              lineHeight={typography.meta.lineHeight}
              color={colors.textMuted}
              mt="$2"
            >
              {t('settings.followingDevice', { scheme: schemeLabel })}
            </Text>
          ) : null}
        </Section>

        <Section title={t('settings.language')} Icon={Languages}>
          <Text
            fontSize={typography.summary.fontSize}
            lineHeight={typography.summary.lineHeight}
            color={colors.textSecondary}
            mb="$3"
          >
            {t('settings.languageHint')}
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
                  accessibilityLabel={t('settings.preferLanguage', { language: t(`language.${lang.code}`) })}
                  style={[styles.langChip, selected ? styles.langChipSelected : null]}
                >
                  <Text
                    fontSize={typography.label.fontSize}
                    lineHeight={typography.label.lineHeight}
                    fontWeight="$semibold"
                    color={selected ? colors.chipSelectedText : colors.text}
                  >
                    {lang.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </Section>

        <Section title={t('settings.blocked')} Icon={Ban}>
          <BlockedRow
            Icon={Ban}
            label={t('settings.sources')}
            count={prefs.blockedSources.length}
            empty={t('settings.noSourcesBlocked')}
            items={prefs.blockedSources}
            onRemove={(name) => prefs.unblockSource(name)}
          />
          <View style={styles.spacer} />
          <BlockedRow
            Icon={Tag}
            label={t('settings.categories')}
            count={prefs.blockedCategories.length}
            empty={t('settings.noCategoriesBlocked')}
            items={prefs.blockedCategories}
            onRemove={(name) => prefs.unblockCategory(name)}
          />
        </Section>

        <Section title={t('settings.alerts')} Icon={BellRing}>
          <Text
            fontSize={typography.summary.fontSize}
            lineHeight={typography.summary.lineHeight}
            color={colors.textSecondary}
            mb="$3"
          >
            {t('settings.alertsHint')}
          </Text>
          <Text
            fontSize={typography.bodySemibold.fontSize}
            lineHeight={typography.bodySemibold.lineHeight}
            fontWeight="$semibold"
            color={colors.text}
            mb="$2"
          >
            {t('settings.status', {
              status: t(
                notificationStatus === 'granted'
                  ? 'settings.statusOn'
                  : notificationStatus === 'denied'
                    ? 'settings.statusOff'
                    : 'settings.statusNotSet',
              ),
            })}
          </Text>
          {notificationError ? (
            <Text
              fontSize={typography.meta.fontSize}
              lineHeight={typography.meta.lineHeight}
              color={notificationStatus === 'granted' ? colors.textMuted : colors.destructive}
              mb="$3"
            >
              {notificationError}
            </Text>
          ) : notificationStatus === 'denied' ? (
            <Text
              fontSize={typography.meta.fontSize}
              lineHeight={typography.meta.lineHeight}
              color={colors.textMuted}
              mb="$3"
            >
              {t('settings.notificationsOffDevice')}
            </Text>
          ) : null}
          <View style={styles.alertActions}>
            <PrimaryButton
              label={t(notificationStatus === 'granted' ? 'settings.refreshAlerts' : 'settings.enableAlerts')}
              onPress={() => {
                void (async () => {
                  if (!citySlug) {
                    return
                  }
                  setNotificationBusy(true)
                  setNotificationError(null)
                  try {
                    const result = await registerNewsNotifications(citySlug, preferredLanguage)
                    setNotificationStatus(
                      result.status === 'granted'
                        ? 'granted'
                        : result.status === 'denied'
                          ? 'denied'
                          : 'dismissed',
                    )
                    if (result.status === 'denied') {
                      await suppressNotificationPrompt('denied')
                      setNotificationError(
                        result.reason ??
                          translate('settings.notificationsBlocked'),
                      )
                    } else if (result.status === 'unsupported') {
                      await suppressNotificationPrompt('dismissed')
                      setNotificationError(result.reason)
                    } else if (result.reason) {
                      setNotificationError(result.reason)
                    } else {
                      setNotificationError(null)
                    }
                  } catch (caught) {
                    setNotificationError(
                      translate('settings.enableAlertsFailed'),
                    )
                  } finally {
                    setNotificationBusy(false)
                  }
                })()
              }}
              accessibilityLabel={t('settings.enableAlerts')}
              style={styles.alertPrimary}
              disabled={notificationBusy}
            />
            {notificationStatus === 'granted' ? (
            <SecondaryButton
              label={t('settings.turnOff')}
              onPress={() => {
                void (async () => {
                  const clientId = await getOrCreateNotificationClientId()
                  const platform = getNotificationPlatform()
                  setNotificationBusy(true)
                  try {
                    await apiClient.deleteNotificationSubscription(clientId, platform)
                    await suppressNotificationPrompt('dismissed')
                    setNotificationStatus('dismissed')
                  } finally {
                    setNotificationBusy(false)
                  }
                })()
              }}
              accessibilityLabel={t('settings.turnOffAlerts')}
              style={styles.alertSecondary}
              outline
              disabled={notificationBusy}
            />
            ) : null}
          </View>
        </Section>

        {/* Single contact entry point: the card opens the in-app /contact page. */}
        <View style={styles.section}>
          <Pressable
            onPress={() => router.push('/contact')}
            accessibilityRole="link"
            accessibilityLabel={t('common.contactUs')}
            accessibilityHint={t('settings.contactHint')}
            style={({ pressed }) => [pressed ? styles.contactEmailPressed : null]}
          >
            <Card>
              <View style={[styles.cardBody, styles.contactCardRow]}>
                <Mail size={18} strokeWidth={iconStroke} color={colors.accent} />
                <View style={styles.contactCardCopy}>
                  <Text
                    fontSize={typography.headlineSm.fontSize}
                    lineHeight={typography.headlineSm.lineHeight}
                    fontWeight="$semibold"
                    color={colors.text}
                  >
                    {t('common.contactUs')}
                  </Text>
                  <Text
                    fontSize={typography.summary.fontSize}
                    lineHeight={typography.summary.lineHeight}
                    color={colors.textSecondary}
                    mt="$1"
                  >
                    {t('settings.contactBody')}
                  </Text>
                </View>
                <ChevronRight size={20} strokeWidth={iconStroke} color={colors.textMuted} />
              </View>
            </Card>
          </Pressable>
        </View>

        <Section title={t('settings.about')} Icon={Info}>
          <Text fontSize={typography.summary.fontSize} lineHeight={24} color={colors.textSecondary}>
            {t('settings.aboutBody')}
          </Text>
          <Text
            fontSize={typography.label.fontSize}
            lineHeight={typography.label.lineHeight}
            fontWeight="$medium"
            color={colors.textMuted}
            mt="$4"
          >
            {t('settings.version', { version })}
          </Text>
          <Text
            fontSize={typography.meta.fontSize}
            lineHeight={typography.meta.lineHeight}
            color={colors.textMuted}
            mt="$2"
          >
            {t('settings.aggregatorNote')}
          </Text>
          <PublicLinks exclude={['contact']} />
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
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  return (
    <View style={styles.section}>
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
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const t = useT()
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
              accessibilityLabel={t('settings.unblockA11y', { name: item })}
              hitSlop={8}
              style={styles.unblockHit}
            >
              <Text
                fontSize={typography.meta.fontSize}
                lineHeight={typography.meta.lineHeight}
                fontWeight="$semibold"
                color={colors.text}
              >
                {t('settings.unblock')}
              </Text>
            </Pressable>
          </View>
        ))
      )}
    </VStack>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background,
    },
    content: {
      paddingHorizontal: space.screen,
      // Fix 8: centred 720 column on wide screens.
      width: '100%',
      maxWidth: 720,
      alignSelf: 'center',
    },
    pageHeader: {
      paddingBottom: space.md,
    },
    welcomeCard: {
      minHeight: 86,
      borderRadius: 20,
      backgroundColor: c.accentFill,
      paddingHorizontal: space.md,
      paddingVertical: space.sm,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: space.xl,
    },
    welcomePressed: {
      opacity: 0.86,
      transform: [{ scale: 0.99 }],
    },
    welcomeIcon: {
      width: 48,
      height: 48,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: c.textOnAccentMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    welcomeCopy: {
      flex: 1,
      marginLeft: space.sm,
    },
    welcomeTitle: {
      color: c.textOnAccent,
      fontSize: 20,
      lineHeight: 26,
      fontWeight: '800',
    },
    welcomeSubtitle: {
      color: c.textOnAccentMuted,
      fontSize: typography.label.fontSize,
      lineHeight: typography.label.lineHeight,
      marginTop: 2,
    },
    section: {
      marginBottom: space.xl,
    },
    cardBody: {
      padding: space.lg,
    },
    cardTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.xs,
      marginBottom: space.md,
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
      minHeight: HIT_TARGET,
      paddingHorizontal: space.md,
      paddingVertical: space.xs,
      borderRadius: 999,
      // Unselected chips need a full-strength border + text so dark mode
      // doesn't read them as disabled.
      borderWidth: 1,
      borderColor: c.textMuted,
      backgroundColor: c.surface,
      justifyContent: 'center',
    },
    langChipSelected: {
      backgroundColor: c.accentFill,
      borderColor: c.accentFill,
    },
    alertActions: {
      gap: space.xs,
      alignItems: 'flex-start',
    },
    alertPrimary: {
      alignSelf: 'flex-start',
    },
    alertSecondary: {
      alignSelf: 'flex-start',
    },
    contactCardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.sm,
    },
    contactCardCopy: {
      flex: 1,
      minWidth: 0,
    },
    contactEmailPressed: {
      opacity: 0.82,
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
}
