import { Pressable, StyleSheet, Text, View } from 'react-native'
import { HIT_TARGET } from '../../theme/tokens'
import { readerColors } from '../../theme/readerTokens'
import { pressableState, webFocusRing } from './focusStyle'

type Props = {
  onBack: () => void
}

export function CaughtUpFooter({ onBack }: Props) {
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
            webFocusRing(Boolean(focused)),
          ]
        }}
      >
        <Text style={styles.btnLabel}>Back to latest news</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 48,
    gap: 8,
  },
  rule: {
    width: 48,
    height: StyleSheet.hairlineWidth,
    backgroundColor: readerColors.sheetBorder,
    marginBottom: 16,
  },
  title: {
    color: readerColors.text,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  body: {
    color: readerColors.textMuted,
    fontSize: 15,
    marginBottom: 8,
  },
  btn: {
    minHeight: HIT_TARGET,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: readerColors.sheetBorder,
    backgroundColor: readerColors.sheet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  btnLabel: {
    color: readerColors.text,
    fontSize: 15,
    fontWeight: '600',
  },
})
