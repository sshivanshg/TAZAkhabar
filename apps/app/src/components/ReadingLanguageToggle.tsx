import { useMemo } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import {
  READING_LANGUAGES,
  type ReadingLanguageCode,
} from '../storage/languagePreference'
import { useTheme } from '../preferences/ThemePreferenceContext'
import { radius } from '../theme/tokens'
import { pressableState, webFocusRing } from './article/focusStyle'

type Palette = 'app' | 'reader'

type Props = {
  value: ReadingLanguageCode
  onChange: (code: ReadingLanguageCode) => void
  palette?: Palette
}

type ToggleColors = {
  border: string
  surface: string
  divider: string
  selectedBg: string
  text: string
  textSelected: string
}

/** Compact EN | हि segmented control for headers and the article reader. */
export function ReadingLanguageToggle({ value, onChange, palette = 'app' }: Props) {
  const { colors, readerColors } = useTheme()
  const toggleColors = useMemo<ToggleColors>(
    () =>
      palette === 'reader'
        ? {
            border: readerColors.sheetBorder,
            surface: readerColors.sheet,
            divider: readerColors.sheetBorder,
            selectedBg: readerColors.accentSoft,
            text: readerColors.textMuted,
            textSelected: readerColors.accent,
          }
        : {
            border: colors.border,
            surface: colors.surfaceRaised,
            divider: colors.border,
            selectedBg: colors.accentSoft,
            text: colors.textMuted,
            textSelected: colors.accent,
          },
    [colors, palette, readerColors],
  )
  const styles = useMemo(() => createStyles(toggleColors), [toggleColors])

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Reading language"
      testID="language-segment"
      style={styles.group}
    >
      {READING_LANGUAGES.map((lang, index) => {
        const selected = value === lang.code
        const label = lang.code === 'en' ? 'EN' : 'हि'
        return (
          <Pressable
            key={lang.code}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`Prefer ${lang.accessibilityLabel}`}
            onPress={() => onChange(lang.code)}
            style={(state) => {
              const { pressed, focused } = pressableState(state)
              return [
                styles.option,
                index === 0 ? styles.optionFirst : styles.optionLast,
                selected ? styles.optionSelected : null,
                pressed && !selected ? styles.optionPressed : null,
                palette === 'reader' && Platform.OS === 'web'
                  ? webFocusRing(Boolean(focused), readerColors)
                  : null,
              ]
            }}
          >
            <Text style={[styles.label, selected ? styles.labelSelected : null]}>{label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

function createStyles(c: ToggleColors) {
  return StyleSheet.create({
    group: {
      flexDirection: 'row',
      alignItems: 'stretch',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderRadius: radius.xs,
      backgroundColor: c.surface,
      overflow: 'hidden',
      flexShrink: 0,
    },
    option: {
      minWidth: 36,
      minHeight: 32,
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionFirst: {
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: c.divider,
    },
    optionLast: {},
    optionSelected: {
      backgroundColor: c.selectedBg,
    },
    optionPressed: {
      opacity: 0.82,
    },
    label: {
      color: c.text,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    labelSelected: {
      color: c.textSelected,
      fontWeight: '700',
    },
  })
}
