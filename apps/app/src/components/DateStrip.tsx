import { useMemo, useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native'
import { Text } from '@gluestack-ui/themed'
import Calendar from 'lucide-react-native/icons/calendar'
import { Chip } from './ui/Chip'
import {
  formatDateStripLabel,
  formatPickerDateLabel,
  shiftIsoDate,
  todayCityIso,
} from '../utils/cityCalendar'
import { colors, HIT_TARGET, radius, space, typography } from '../theme/tokens'
import { iconStroke } from '../theme/categoryIcons'

type Props = {
  /** Selected city-local YYYY-MM-DD (session only). */
  selectedDate: string
  /** Dates that have articles (YYYY-MM-DD), newest first. Empty → strip still shows last 7 days. */
  availableDates: string[]
  onSelectDate: (iso: string) => void
}

const STRIP_DAYS = 7

/**
 * Edition date strip — last 7 city-local days + calendar for older available dates.
 */
export function DateStrip({ selectedDate, availableDates, onSelectDate }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const today = todayCityIso()

  const stripDates = useMemo(() => {
    const days: string[] = []
    for (let i = 0; i < STRIP_DAYS; i += 1) {
      days.push(shiftIsoDate(today, -i))
    }
    return days
  }, [today])

  const availableSet = useMemo(() => new Set(availableDates), [availableDates])

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        accessibilityRole="tablist"
        accessibilityLabel="Edition date"
      >
        {stripDates.map((iso) => {
          const hasStories = availableSet.size === 0 || availableSet.has(iso) || iso === today
          const selected = iso === selectedDate
          return (
            <Chip
              key={iso}
              label={formatDateStripLabel(iso, today)}
              selected={selected}
              onPress={() => onSelectDate(iso)}
              accessibilityLabel={`Edition ${formatDateStripLabel(iso, today)}`}
              style={!hasStories && !selected ? styles.dimmed : undefined}
            />
          )
        })}
        <Pressable
          onPress={() => setPickerOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="More dates"
          accessibilityState={{ expanded: pickerOpen }}
          style={({ pressed }) => [styles.moreBtn, pressed && styles.morePressed]}
        >
          <Calendar size={18} color={colors.accent} strokeWidth={iconStroke} />
        </Pressable>
      </ScrollView>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable
          style={styles.scrim}
          onPress={() => setPickerOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Dismiss date picker"
        >
          <Pressable
            style={styles.sheet}
            onPress={(e) => e.stopPropagation()}
            accessibilityViewIsModal
            accessibilityLabel="Choose edition date"
          >
            <Text
              fontSize={typography.headlineSm.fontSize}
              lineHeight={typography.headlineSm.lineHeight}
              fontWeight="$semibold"
              color={colors.text}
              mb="$3"
            >
              Choose a date
            </Text>
            <Text
              fontSize={typography.summary.fontSize}
              lineHeight={typography.summary.lineHeight}
              color={colors.textSecondary}
              mb="$3"
            >
              Only dates with stories in this city are listed (last 30 days).
            </Text>
            <ScrollView style={styles.pickerList} bounces={false}>
              {(availableDates.length > 0 ? availableDates : stripDates).map((iso) => {
                const selected = iso === selectedDate
                return (
                  <Pressable
                    key={iso}
                    onPress={() => {
                      onSelectDate(iso)
                      setPickerOpen(false)
                    }}
                    style={[styles.pickerRow, selected && styles.pickerRowSelected]}
                    accessibilityRole="button"
                    accessibilityLabel={`Choose ${iso === today ? 'Today' : formatPickerDateLabel(iso)}`}
                    accessibilityState={{ selected }}
                  >
                    <Text
                      fontSize={typography.summary.fontSize}
                      lineHeight={typography.summary.lineHeight}
                      fontWeight={selected ? '$semibold' : '$normal'}
                      color={selected ? colors.accent : colors.text}
                    >
                      {iso === today ? 'Today' : formatPickerDateLabel(iso)}
                    </Text>
                  </Pressable>
                )
              })}
            </ScrollView>
            <Pressable
              onPress={() => setPickerOpen(false)}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close date picker"
            >
              <Text
                fontSize={typography.summary.fontSize}
                fontWeight="$medium"
                color={colors.textSecondary}
              >
                Close
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  content: {
    paddingHorizontal: space.screen,
    paddingBottom: 6,
    alignItems: 'center',
    gap: 8,
  },
  dimmed: {
    opacity: 0.45,
  },
  moreBtn: {
    minHeight: HIT_TARGET,
    minWidth: HIT_TARGET,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  morePressed: {
    opacity: 0.85,
  },
  scrim: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    paddingHorizontal: space.lg,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    maxHeight: '70%',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pickerList: {
    maxHeight: 320,
  },
  pickerRow: {
    minHeight: HIT_TARGET,
    paddingVertical: space.sm,
    paddingHorizontal: space.sm,
    borderRadius: radius.sm,
  },
  pickerRowSelected: {
    backgroundColor: colors.accentSoft,
  },
  closeBtn: {
    marginTop: space.md,
    alignItems: 'center',
    paddingVertical: space.sm,
  },
})
