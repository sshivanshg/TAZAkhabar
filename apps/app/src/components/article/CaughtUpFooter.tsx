import { useMemo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../../preferences/ThemePreferenceContext'
import { HIT_TARGET } from '../../theme/tokens'
import type { ReaderColors } from '../../theme/readerTokens'
import { pressableState, webFocusRing } from './focusStyle'

type Props = {
  onBack: () => void
}

export function CaughtUpFooter({ onBack }: Props) {
  const { readerColors } = useTheme()
  const styles = useMemo(() => createStyles(readerColors), [readerColors])

  return (
    <View testID="caught-up" style={styles.wrap}>
      <View style={styles.rule} />
      <Text style={styles.title}>You’re all caught up</Text>
      <Text style={styles.body}>That’s all the latest for now.</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to latest news"
        onPress={onBack}
        style={(state) => {
          const { pressed, focused } = pressableState(state)
          return [
            styles.btn,
            pressed ? styles.pressed : null,
            webFocusRing(Boolean(focused), readerColors),
          ]
        }}
      >
        <Text style={styles.btnLabel}>Back to latest news</Text>
      </Pressable>
    </View>
  )
}

function createStyles(c: ReaderColors) {
  return StyleSheet.create({
    wrap: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 24,
      gap: 8,
    },
    rule: {
      width: 48,
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.sheetBorder,
      marginBottom: 16,
    },
    title: {
      color: c.text,
      fontSize: 20,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    body: {
      color: c.textMuted,
      fontSize: 15,
      marginBottom: 8,
    },
    btn: {
      minHeight: HIT_TARGET,
      paddingHorizontal: 18,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.sheetBorder,
      backgroundColor: c.sheet,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pressed: {
      opacity: 0.8,
    },
    btnLabel: {
      color: c.text,
      fontSize: 15,
      fontWeight: '600',
    },
  })
}
