import { StyleSheet, Text, View } from 'react-native'
import { readerColors } from '../../theme/readerTokens'

export function StoryDivider() {
  return (
    <View
      testID="next-story-divider"
      accessibilityRole="header"
      accessibilityLabel="Next story"
      style={styles.wrap}
    >
      <View style={styles.line} />
      <Text style={styles.label}>NEXT STORY</Text>
      <View style={styles.line} />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: readerColors.sheetBorder,
  },
  label: {
    color: readerColors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
  },
})
