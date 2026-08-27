import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import {
  READING_LANGUAGES,
  type ReadingLanguageCode,
} from '../../storage/languagePreference'
import { useTheme } from '../../preferences/ThemePreferenceContext'
import { HIT_TARGET } from '../../theme/tokens'
import type { ReaderColors } from '../../theme/readerTokens'
import { pressableState, webFocusRing } from './focusStyle'

type Props = {
  value: ReadingLanguageCode
  onChange: (code: ReadingLanguageCode) => void
}

/** Compact EN | हिंदी segmented control for the article reader. */
export function LanguageSegment({ value, onChange }: Props) {
  const { readerColors } = useTheme()
  const styles = useMemo(() => createStyles(readerColors), [readerColors])

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel="Reading language"
      testID="language-segment"
      style={styles.group}
    >
      {READING_LANGUAGES.map((lang, index) => {
        const selected = value === lang.code
        const label = lang.code === 'en' ? 'EN' : 'हिंदी'
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
                webFocusRing(Boolean(focused), readerColors),
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

function createStyles(c: ReaderColors) {
  return StyleSheet.create({
    group: {
      flexDirection: 'row',
      alignItems: 'stretch',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.sheetBorder,
      borderRadius: 10,
      backgroundColor: c.sheet,
      overflow: 'hidden',
    },
    option: {
      minWidth: HIT_TARGET,
      minHeight: 36,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionFirst: {
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: c.sheetBorder,
    },
    optionLast: {},
    optionSelected: {
      backgroundColor: c.accentSoft,
    },
    optionPressed: {
      opacity: 0.82,
    },
    label: {
      color: c.textMuted,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    labelSelected: {
      color: c.accent,
      fontWeight: '700',
    },
  })
}
