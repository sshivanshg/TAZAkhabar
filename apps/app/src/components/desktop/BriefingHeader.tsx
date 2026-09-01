import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from '@gluestack-ui/themed'
import { useTheme } from '../../preferences/ThemePreferenceContext'
import { formatPickerDateLabel, todayCityIso } from '../../utils/cityCalendar'
import { space, typography, type AppColors } from '../../theme/tokens'

type Props = {
  cityTitle?: string
}

/** "Your briefing" header with today's date — Google News home rhythm. */
export function BriefingHeader({ cityTitle }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const todayLabel = formatPickerDateLabel(todayCityIso())

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <Text
          fontSize={typography.display.fontSize}
          lineHeight={typography.display.lineHeight}
          fontWeight="$bold"
          color={colors.text}
          letterSpacing={-0.5}
        >
          Your briefing
        </Text>
        <Text
          fontSize={typography.meta.fontSize}
          lineHeight={typography.meta.lineHeight}
          color={colors.textMuted}
          mt="$1"
        >
          {todayLabel}
        </Text>
      </View>
      {cityTitle ? (
        <View style={styles.cityChip} accessibilityLabel={`Edition: ${cityTitle}`}>
          <Text
            fontSize={typography.meta.fontSize}
            lineHeight={typography.meta.lineHeight}
            fontWeight="$semibold"
            color={colors.text}
            numberOfLines={1}
          >
            {cityTitle}
          </Text>
        </View>
      ) : null}
    </View>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      paddingHorizontal: space.screen,
      paddingTop: space.md,
      paddingBottom: space.sm,
      gap: space.md,
    },
    left: {
      flex: 1,
      minWidth: 0,
    },
    cityChip: {
      paddingHorizontal: space.md,
      paddingVertical: space.sm,
      borderRadius: 12,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      maxWidth: 160,
    },
  })
}
