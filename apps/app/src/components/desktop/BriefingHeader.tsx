import { useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from '@gluestack-ui/themed'
import { useTheme } from '../../preferences/ThemePreferenceContext'
import { formatPickerDateLabel, todayCityIso } from '../../utils/cityCalendar'
import { space, typography, type AppColors } from '../../theme/tokens'

type Props = {
  /** When omitted, shows the default “Your briefing” home title with today’s date. */
  title?: string
  subtitle?: string
}

/** Page title for expanded home — briefing date or a category-focused heading. */
export function BriefingHeader({ title = 'Your briefing', subtitle }: Props) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const todayLabel = formatPickerDateLabel(todayCityIso())
  const resolvedSubtitle =
    subtitle ?? (title === 'Your briefing' ? todayLabel : undefined)

  return (
    <View style={styles.wrap}>
      <Text
        fontSize={typography.display.fontSize}
        lineHeight={typography.display.lineHeight}
        fontWeight="$bold"
        color={colors.text}
        letterSpacing={-0.5}
      >
        {title}
      </Text>
      {resolvedSubtitle ? (
        <Text
          fontSize={typography.meta.fontSize}
          lineHeight={typography.meta.lineHeight}
          color={colors.textMuted}
          mt="$1"
        >
          {resolvedSubtitle}
        </Text>
      ) : null}
    </View>
  )
}

function createStyles(_c: AppColors) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: space.screen,
      paddingTop: space.md,
      paddingBottom: space.sm,
    },
  })
}
