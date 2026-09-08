import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, View, type PressableStateCallbackType } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Constants from 'expo-constants'
import { useFocusEffect, useRouter } from 'expo-router'
import { Text } from '@gluestack-ui/themed'
import { MotiView } from 'moti'
import ArrowLeft from 'lucide-react-native/icons/arrow-left'
import Ban from 'lucide-react-native/icons/ban'
import BellRing from 'lucide-react-native/icons/bell-ring'
import Info from 'lucide-react-native/icons/info'
import Languages from 'lucide-react-native/icons/languages'
import MapPin from 'lucide-react-native/icons/map-pin'
import Moon from 'lucide-react-native/icons/moon'
import Tag from 'lucide-react-native/icons/tag'
import type { CityResponse } from '@tazakhabar/shared-types'
import { apiClient } from '../../src/api/client'
import { ScreenErrorBoundary } from '../../src/components/ScreenErrorBoundary'
import { TabScreenShell } from '../../src/components/TabScreenShell'
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
import { READING_LANGUAGES, type ReadingLanguageCode } from '../../src/storage/languagePreference'
import { type ThemePreference } from '../../src/storage/themePreference'
import {
  createGlobalCity,
  getCityDisplayLabel,
  getEffectiveCitySlug,
  isGlobalCitySlug,
} from '../../src/storage/cityPreference'
import { HIT_TARGET, radius, space, type AppColors } from '../../src/theme/tokens'
import { iconStroke } from '../../src/theme/categoryIcons'
import { useTabBarClearance } from '../../src/theme/useTabBarClearance'
import { isExpandedLayout, useBreakpoint } from '../../src/hooks/useBreakpoint'
import { useCityPicker } from '../../src/hooks/useCityPicker'

type SectionId = 'city' | 'appearance' | 'language' | 'blocked' | 'alerts' | 'about'

type SectionDef = {
  id: SectionId
  label: string
  Icon: typeof MapPin
}

const SECTIONS: SectionDef[] = [
  { id: 'city', label: 'City', Icon: MapPin },
  { id: 'appearance', label: 'Appearance', Icon: Moon },
  { id: 'language', label: 'Language', Icon: Languages },
  { id: 'blocked', label: 'Blocked', Icon: Ban },
  { id: 'alerts', label: 'Alerts', Icon: BellRing },
  { id: 'about', label: 'About', Icon: Info },
]

type WebPressableState = PressableStateCallbackType & {
  hovered?: boolean
  focused?: boolean
}

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
  const {
    colors,
    preference: themePreference,
    setPreference: setThemePreference,
    colorScheme,
    ready: themeReady,
  } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const tabClearance = useTabBarClearance()
  const desktop = isExpandedLayout(useBreakpoint())
  const mobile = useBreakpoint() === 'mobile'
  const [activeSection, setActiveSection] = useState<SectionId>('city')
  const [cityMeta, setCityMeta] = useState<CityResponse | null>(null)
  const [citySlug, setCitySlug] = useState<string | null>(null)
  const [notificationStatus, setNotificationStatus] = useState<
    'unknown' | 'granted' | 'denied' | 'dismissed'
  >('unknown')
  const [notificationBusy, setNotificationBusy] = useState(false)
  const [notificationError, setNotificationError] = useState<string | null>(null)

  const loadCity = useCallback(async () => {
    const slug = await getEffectiveCitySlug()
    setCitySlug(slug)
    if (isGlobalCitySlug(slug)) {
      setCityMeta(createGlobalCity())
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

  const cityTitle = getCityDisplayLabel(citySlug, cityMeta?.name)
  const version =
    Constants.expoConfig?.version ?? Constants.nativeAppVersion ?? '0.1.0'
  const themeLabel =
    themePreference === 'system'
      ? `System (${colorScheme})`
      : themePreference.charAt(0).toUpperCase() + themePreference.slice(1)
  const languageLabel =
    READING_LANGUAGES.find((lang) => lang.code === preferredLanguage)?.label ?? 'English'
  const blockedCount = prefs.blockedSources.length + prefs.blockedCategories.length
  const alertLabel =
    notificationStatus === 'granted'
      ? 'On'
      : notificationStatus === 'denied'
        ? 'Off'
        : 'Not set'

  const sectionHint = (id: SectionId): string => {
    switch (id) {
      case 'city':
        return cityTitle
      case 'appearance':
        return themeLabel
      case 'language':
        return languageLabel
      case 'blocked':
        return blockedCount > 0 ? `${blockedCount} hidden` : 'None'
      case 'alerts':
        return alertLabel
      case 'about':
        return `v${version}`
    }
  }

  const { openCityPicker, picker: cityPicker } = useCityPicker({
    citySlug,
    mobile,
    forceSheet: true,
    onCitySelected: (city) => {
      if (city.slug) {
        setCitySlug(city.slug)
        setCityMeta(city)
      }
    },
  })

  const onBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back()
      return
    }
    router.replace('/(tabs)')
  }, [router])

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
            paddingTop: desktop ? space.lg : Math.max(insets.top, space.xs) + space.sm,
            paddingBottom: desktop
              ? space.xl
              : tabClearance + Math.max(insets.bottom, 0),
          },
        ]}
      >
        <View style={styles.pageHeader}>
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={4}
            style={({ pressed }) => [styles.backBtn, pressed ? styles.backPressed : null]}
          >
            <ArrowLeft size={20} strokeWidth={iconStroke} color={colors.text} />
          </Pressable>
          <Text style={styles.pageTitle}>Settings</Text>
        </View>

        <View style={[styles.workspace, desktop ? styles.workspaceDesktop : styles.workspaceMobile]}>
          <View
            style={[styles.navColumn, desktop ? styles.navColumnDesktop : styles.navColumnMobile]}
            accessibilityRole="tablist"
          >
            <Text style={styles.navGroupLabel}>GENERAL</Text>
            {SECTIONS.map((section) => (
              <NavItem
                key={section.id}
                label={section.label}
                hint={sectionHint(section.id)}
                Icon={section.Icon}
                selected={activeSection === section.id}
                onPress={() => setActiveSection(section.id)}
              />
            ))}
          </View>

          <View style={styles.panelColumn}>
            <PanelLead section={activeSection} />

            <View style={styles.settingGroup}>
              {activeSection === 'city' ? (
                <CityPanel cityTitle={cityTitle} onChangeCity={openCityPicker} />
              ) : null}
              {activeSection === 'appearance' ? (
                <AppearancePanel
                  themePreference={themePreference}
                  themeReady={themeReady}
                  colorScheme={colorScheme}
                  onSelect={setThemePreference}
                />
              ) : null}
              {activeSection === 'language' ? (
                <LanguagePanel
                  preferredLanguage={preferredLanguage}
                  languageReady={languageReady}
                  onSelect={setPreferredLanguage}
                />
              ) : null}
              {activeSection === 'blocked' ? (
                <BlockedPanel
                  blockedSources={prefs.blockedSources}
                  blockedCategories={prefs.blockedCategories}
                  onUnblockSource={prefs.unblockSource}
                  onUnblockCategory={prefs.unblockCategory}
                />
              ) : null}
              {activeSection === 'alerts' ? (
                <AlertsPanel
                  citySlug={citySlug}
                  preferredLanguage={preferredLanguage}
                  notificationStatus={notificationStatus}
                  notificationBusy={notificationBusy}
                  notificationError={notificationError}
                  alertLabel={alertLabel}
                  onEnable={async () => {
                    if (!citySlug || isGlobalCitySlug(citySlug)) return
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
                            'Notifications are blocked for this app. Check device or browser settings.',
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
                        caught instanceof Error ? caught.message : 'Could not enable news alerts.',
                      )
                    } finally {
                      setNotificationBusy(false)
                    }
                  }}
                  onDisable={async () => {
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
                  }}
                />
              ) : null}
              {activeSection === 'about' ? <AboutPanel version={version} /> : null}
            </View>
          </View>
        </View>
      </ScrollView>
      {cityPicker}
    </MotiView>
  )
}

function NavItem({
  label,
  hint,
  Icon,
  selected,
  onPress,
}: {
  label: string
  hint: string
  Icon: typeof MapPin
  selected: boolean
  onPress: () => void
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label}, ${hint}`}
      style={({ pressed, hovered }: WebPressableState) => [
        styles.navItem,
        selected ? styles.navItemSelected : null,
        pressed ? styles.navItemPressed : null,
        hovered && !selected ? styles.navItemHovered : null,
      ]}
    >
      <Icon
        size={15}
        strokeWidth={iconStroke}
        color={selected ? colors.text : colors.textMuted}
        style={styles.navIcon}
      />
      <View style={styles.navTextBlock}>
        <Text style={[styles.navLabel, selected ? styles.navLabelSelected : null]}>{label}</Text>
        <Text style={styles.navHint} numberOfLines={1}>
          {hint}
        </Text>
      </View>
    </Pressable>
  )
}

function PanelLead({ section }: { section: SectionId }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  const copy: Record<SectionId, string> = {
    city: 'Choose where your feed is focused. All India mixes news from every city.',
    appearance: 'Saved on this device only.',
    language: 'Translated on this device when available.',
    blocked: 'Hidden from your feed on this device.',
    alerts: 'Local breaking-news alerts for your city.',
    about: 'No account required.',
  }

  return <Text style={styles.panelLead}>{copy[section]}</Text>
}

function SettingRow({
  label,
  value,
  actionLabel,
  onPress,
  showDivider = true,
}: {
  label: string
  value?: string
  actionLabel?: string
  onPress?: () => void
  showDivider?: boolean
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View style={[styles.settingRow, showDivider ? styles.settingRowDivider : null]}>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={styles.settingTrailing}>
        {value ? (
          <Text style={styles.settingValue} numberOfLines={1}>
            {value}
          </Text>
        ) : null}
        {actionLabel && onPress ? (
          <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
            hitSlop={6}
            style={({ pressed }) => [pressed ? styles.settingActionPressed : null]}
          >
            <Text style={styles.settingAction}>{actionLabel}</Text>
          </Pressable>
        ) : actionLabel ? (
          <Text style={styles.settingActionMuted}>{actionLabel}</Text>
        ) : null}
      </View>
    </View>
  )
}

function SettingInset({ children, showDivider = true }: { children: ReactNode; showDivider?: boolean }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  return (
    <View style={[styles.settingInset, showDivider ? styles.settingRowDivider : null]}>{children}</View>
  )
}

function CityPanel({
  cityTitle,
  onChangeCity,
}: {
  cityTitle: string
  onChangeCity: () => void
}) {
  return (
    <SettingRow
      label="City"
      value={cityTitle}
      actionLabel="Change"
      onPress={onChangeCity}
      showDivider={false}
    />
  )
}

function AppearancePanel({
  themePreference,
  themeReady,
  colorScheme,
  onSelect,
}: {
  themePreference: ThemePreference
  themeReady: boolean
  colorScheme: 'light' | 'dark'
  onSelect: (value: ThemePreference) => void
}) {
  const options = [
    { value: 'light' as const, label: 'Light' },
    { value: 'dark' as const, label: 'Dark' },
    { value: 'system' as const, label: 'System' },
  ]

  return (
    <SegmentBar
      options={options.map((option) => ({
        value: option.value,
        label:
          option.value === 'system' && themeReady
            ? `System (${colorScheme})`
            : option.label,
      }))}
      selected={themePreference}
      ready={themeReady}
      onSelect={onSelect}
      accessibilityPrefix="Appearance"
    />
  )
}

function LanguagePanel({
  preferredLanguage,
  languageReady,
  onSelect,
}: {
  preferredLanguage: ReadingLanguageCode
  languageReady: boolean
  onSelect: (code: ReadingLanguageCode) => void
}) {
  return (
    <SegmentBar
      options={READING_LANGUAGES.map((lang) => ({
        value: lang.code,
        label: lang.label,
      }))}
      selected={preferredLanguage}
      ready={languageReady}
      onSelect={(code) => onSelect(code as ReadingLanguageCode)}
      accessibilityPrefix="Reading language"
      wrap
    />
  )
}

function BlockedPanel({
  blockedSources,
  blockedCategories,
  onUnblockSource,
  onUnblockCategory,
}: {
  blockedSources: string[]
  blockedCategories: string[]
  onUnblockSource: (name: string) => void
  onUnblockCategory: (name: string) => void
}) {
  return (
    <View>
      <BlockedRow
        Icon={Ban}
        label="Sources"
        count={blockedSources.length}
        empty="No sources blocked"
        items={blockedSources}
        onRemove={onUnblockSource}
        showDivider
      />
      <BlockedRow
        Icon={Tag}
        label="Categories"
        count={blockedCategories.length}
        empty="No categories blocked"
        items={blockedCategories}
        onRemove={onUnblockCategory}
        showDivider={false}
      />
    </View>
  )
}

function AlertsPanel({
  citySlug,
  preferredLanguage,
  notificationStatus,
  notificationBusy,
  notificationError,
  alertLabel,
  onEnable,
  onDisable,
}: {
  citySlug: string | null
  preferredLanguage: ReadingLanguageCode
  notificationStatus: 'unknown' | 'granted' | 'denied' | 'dismissed'
  notificationBusy: boolean
  notificationError: string | null
  alertLabel: string
  onEnable: () => void
  onDisable: () => void
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const alertsNeedCity = !citySlug || isGlobalCitySlug(citySlug)

  return (
    <SettingInset showDivider={false}>
      <View style={styles.alertRow}>
        <View style={styles.alertCopy}>
          <Text style={styles.settingValue}>{alertLabel}</Text>
          <Text style={styles.fieldHelp}>
            {alertsNeedCity
              ? 'Pick a city to enable local alerts.'
              : notificationStatus === 'granted'
                ? 'Enabled on this device.'
                : notificationStatus === 'denied'
                  ? 'Blocked in device settings.'
                  : 'Not set up yet.'}
          </Text>
          {notificationError ? (
            <Text
              style={[
                styles.fieldHelp,
                {
                  color:
                    notificationStatus === 'granted' ? colors.textMuted : colors.destructive,
                },
              ]}
            >
              {notificationError}
            </Text>
          ) : null}
        </View>
        <View style={styles.alertActions}>
          <PrimaryButton
            label={notificationStatus === 'granted' ? 'Refresh' : 'Enable'}
            onPress={() => void onEnable()}
            accessibilityLabel="Enable alerts"
            style={styles.alertActionBtn}
            disabled={notificationBusy || alertsNeedCity}
          />
          <SecondaryButton
            label="Off"
            onPress={() => void onDisable()}
            accessibilityLabel="Turn off alerts"
            style={styles.alertActionBtn}
            outline
            disabled={notificationBusy || notificationStatus !== 'granted'}
          />
        </View>
      </View>
    </SettingInset>
  )
}

function AboutPanel({ version }: { version: string }) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <SettingInset showDivider={false}>
      <Text style={styles.fieldHelp}>
        Read summaries, save stories on this device, and share in one tap.
      </Text>
      <Text style={styles.fieldMeta}>Version {version}</Text>
      <PublicLinks />
    </SettingInset>
  )
}

function SegmentBar<T extends string>({
  options,
  selected,
  ready,
  onSelect,
  accessibilityPrefix,
  wrap = false,
}: {
  options: { value: T; label: string }[]
  selected: T
  ready: boolean
  onSelect: (value: T) => void
  accessibilityPrefix: string
  wrap?: boolean
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <SettingInset showDivider={false}>
      <View style={[styles.segmentBar, wrap ? styles.segmentBarWrap : null]}>
        {options.map((option) => {
          const isSelected = ready && selected === option.value
          return (
            <Pressable
              key={option.value}
              onPress={() => onSelect(option.value)}
              accessibilityRole="button"
              accessibilityLabel={`${accessibilityPrefix} ${option.label}`}
              accessibilityState={{ selected: isSelected }}
              style={({ pressed }) => [
                styles.segmentOption,
                wrap ? styles.segmentOptionWrap : null,
                isSelected ? styles.segmentOptionSelected : null,
                pressed && !isSelected ? styles.segmentOptionPressed : null,
              ]}
            >
              <Text
                style={[styles.segmentLabel, isSelected ? styles.segmentLabelSelected : null]}
                numberOfLines={1}
              >
                {option.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </SettingInset>
  )
}

function BlockedRow({
  Icon,
  label,
  count,
  empty,
  items,
  onRemove,
  showDivider = true,
}: {
  Icon: typeof Ban
  label: string
  count: number
  empty: string
  items: string[]
  onRemove: (value: string) => void
  showDivider?: boolean
}) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View style={[styles.blockedSection, showDivider ? styles.settingRowDivider : null]}>
      <View style={styles.blockedSummary}>
        <Icon size={13} strokeWidth={iconStroke} color={colors.textMuted} />
        <Text style={styles.blockedLabel}>{label}</Text>
        <View style={styles.countPill}>
          <Text style={styles.countPillText}>{count > 0 ? String(count) : '0'}</Text>
        </View>
      </View>
      {items.length === 0 ? (
        <Text style={styles.blockedEmpty}>{empty}</Text>
      ) : (
        items.map((item) => (
          <View key={item} style={styles.prefRow}>
            <Text style={styles.prefRowText} numberOfLines={1}>
              {item}
            </Text>
            <Pressable
              onPress={() => onRemove(item)}
              accessibilityRole="button"
              accessibilityLabel={`Unblock ${item}`}
              hitSlop={6}
              style={({ pressed }) => [
                styles.unblockHit,
                pressed ? styles.unblockPressed : null,
              ]}
            >
              <Text style={styles.unblockText}>Unblock</Text>
            </Pressable>
          </View>
        ))
      )}
    </View>
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
      maxWidth: 1080,
      width: '100%',
      alignSelf: 'center',
    },
    pageHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.xs,
      marginBottom: space.md,
    },
    backBtn: {
      width: HIT_TARGET,
      height: HIT_TARGET,
      marginLeft: -space.xs,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.full,
    },
    backPressed: {
      backgroundColor: c.surfaceRaised,
    },
    pageTitle: {
      fontSize: 18,
      lineHeight: 24,
      fontWeight: '600',
      color: c.text,
    },
    workspace: {
      width: '100%',
    },
    workspaceDesktop: {
      flexDirection: 'row',
      gap: space.xl,
      alignItems: 'flex-start',
    },
    workspaceMobile: {
      flexDirection: 'row',
      gap: space.sm,
      alignItems: 'flex-start',
    },
    navColumn: {
      flexShrink: 0,
    },
    navColumnDesktop: {
      width: 176,
    },
    navColumnMobile: {
      width: 128,
    },
    navGroupLabel: {
      color: c.textMuted,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.6,
      marginBottom: space.xs,
      paddingHorizontal: space.xs,
    },
    navItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: space.xs,
      paddingHorizontal: space.xs,
      paddingVertical: 8,
      borderRadius: radius.xs,
      marginBottom: 2,
      minHeight: HIT_TARGET - 4,
    },
    navItemSelected: {
      backgroundColor: c.surfaceRaised,
    },
    navItemPressed: {
      opacity: 0.7,
    },
    navItemHovered: {
      backgroundColor: c.surface,
    },
    navIcon: {
      marginTop: 2,
    },
    navTextBlock: {
      flex: 1,
      minWidth: 0,
    },
    navLabel: {
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '500',
      color: c.textSecondary,
    },
    navLabelSelected: {
      fontWeight: '600',
      color: c.text,
    },
    navHint: {
      fontSize: 12,
      lineHeight: 16,
      color: c.textMuted,
      marginTop: 1,
    },
    panelColumn: {
      flex: 1,
      minWidth: 0,
      maxWidth: 420,
    },
    panelLead: {
      fontSize: 13,
      lineHeight: 18,
      color: c.textMuted,
      marginBottom: space.xs,
    },
    settingGroup: {
      backgroundColor: c.surface,
      borderRadius: radius.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      overflow: 'hidden',
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: space.sm,
      minHeight: 44,
      paddingHorizontal: space.sm,
      paddingVertical: 10,
    },
    settingRowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    settingInset: {
      paddingHorizontal: space.sm,
      paddingVertical: space.sm,
    },
    settingLabel: {
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '500',
      color: c.text,
      flexShrink: 0,
    },
    settingTrailing: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: space.xs,
      minWidth: 0,
    },
    settingValue: {
      fontSize: 14,
      lineHeight: 18,
      color: c.textSecondary,
      textAlign: 'right',
      flexShrink: 1,
    },
    settingAction: {
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '600',
      color: c.accent,
    },
    settingActionMuted: {
      fontSize: 14,
      lineHeight: 18,
      fontWeight: '600',
      color: c.textMuted,
    },
    settingActionPressed: {
      opacity: 0.7,
    },
    segmentBar: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 4,
      backgroundColor: c.surfaceRaised,
      borderRadius: radius.xs,
      padding: 3,
    },
    segmentBarWrap: {
      flexWrap: 'wrap',
    },
    segmentOption: {
      flex: 1,
      minHeight: 36,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: space.xs,
      borderRadius: radius.xs - 2,
    },
    segmentOptionWrap: {
      flexGrow: 1,
      flexBasis: '30%',
      minWidth: 88,
    },
    segmentOptionSelected: {
      backgroundColor: c.surface,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 2,
      elevation: 1,
    },
    segmentOptionPressed: {
      opacity: 0.85,
    },
    segmentLabel: {
      fontSize: 13,
      lineHeight: 16,
      fontWeight: '500',
      color: c.textMuted,
    },
    segmentLabelSelected: {
      fontWeight: '600',
      color: c.text,
    },
    fieldHelp: {
      fontSize: 13,
      lineHeight: 18,
      color: c.textMuted,
      marginTop: 2,
    },
    fieldMeta: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500',
      color: c.textMuted,
      marginTop: space.xs,
    },
    alertRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: space.sm,
    },
    alertCopy: {
      flex: 1,
      minWidth: 140,
    },
    alertActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: space.xs,
    },
    alertActionBtn: {
      minHeight: 34,
      paddingHorizontal: space.sm,
    },
    blockedSection: {
      paddingHorizontal: space.sm,
      paddingVertical: space.xs,
    },
    blockedSummary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.xs,
      minHeight: 32,
      marginBottom: 2,
    },
    blockedLabel: {
      flex: 1,
      fontSize: 13,
      lineHeight: 16,
      fontWeight: '600',
      color: c.text,
    },
    countPill: {
      minHeight: 20,
      paddingHorizontal: 6,
      borderRadius: radius.full,
      backgroundColor: c.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
    },
    countPillText: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600',
      color: c.textMuted,
    },
    blockedEmpty: {
      fontSize: 13,
      lineHeight: 18,
      color: c.textMuted,
      paddingLeft: 20,
      paddingBottom: 4,
    },
    prefRow: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 34,
      gap: space.xs,
      paddingLeft: 20,
    },
    prefRowText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
      color: c.textSecondary,
    },
    unblockHit: {
      minHeight: 32,
      minWidth: 32,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: space.xxs,
      borderRadius: radius.full,
    },
    unblockPressed: {
      backgroundColor: c.surfaceRaised,
    },
    unblockText: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
      color: c.text,
    },
  })
}
