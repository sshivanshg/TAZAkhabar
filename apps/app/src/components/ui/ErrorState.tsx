import { type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from '@gluestack-ui/themed'
import Svg, { Path } from 'react-native-svg'
import { useTheme } from '../../preferences/ThemePreferenceContext'
import { space, typography } from '../../theme/tokens'
import { PrimaryButton } from './PrimaryButton'
import { SecondaryButton } from './PrimaryButton'

export const ERROR_STATE_COPY = {
  title: 'Something went wrong',
  retry: 'Try again',
  retryA11y: 'Retry loading articles',
  secondary: 'Back to feed',
} as const

type Props = {
  title?: string
  message: string
  onRetry?: () => void
  retryLabel?: string
  retryAccessibilityLabel?: string
  onSecondary?: () => void
  secondaryLabel?: string
  children?: ReactNode
}

function OfflineIcon({ stroke }: { stroke: string }) {
  return (
    <Svg width={72} height={72} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path
        d="M2 8.82A15.91 15.91 0 0 1 12 5c2.3 0 4.47.5 6.4 1.4M5 12.86A10.94 10.94 0 0 1 12 11c1.5 0 2.93.3 4.22.84M8.5 16.43A6 6 0 0 1 12 16c.7 0 1.37.1 2 .29M12 20h.01M2 2l20 20"
        stroke={stroke}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  )
}

/**
 * Error state: explanation in the upper half, actions in the lower half.
 * Primary + secondary buttons stay visually distinct.
 */
export function ErrorState({
  title = ERROR_STATE_COPY.title,
  message,
  onRetry,
  retryLabel = ERROR_STATE_COPY.retry,
  retryAccessibilityLabel,
  onSecondary,
  secondaryLabel = ERROR_STATE_COPY.secondary,
}: Props) {
  const { colors } = useTheme()

  return (
    <View style={styles.root} accessibilityRole="alert">
      <View style={styles.group}>
        <OfflineIcon stroke={colors.textMuted} />
        <Text
          fontSize={typography.headlineSm.fontSize}
          lineHeight={typography.headlineSm.lineHeight}
          fontWeight="$semibold"
          color={colors.text}
          textAlign="center"
          mt="$2"
        >
          {title}
        </Text>
        <Text
          fontSize={typography.summary.fontSize}
          lineHeight={typography.summary.lineHeight}
          color={colors.textSecondary}
          textAlign="center"
          style={styles.message}
        >
          {message}
        </Text>
      </View>
      {/* Actions sit in the lower half, inside thumb reach on a phone. */}
      <View style={[styles.group, styles.actions]}>
        {onRetry ? (
          <PrimaryButton
            label={retryLabel}
            onPress={onRetry}
            accessibilityLabel={
              retryAccessibilityLabel ??
              (retryLabel === ERROR_STATE_COPY.retry ? ERROR_STATE_COPY.retryA11y : retryLabel)
            }
            fullWidth
            style={styles.primary}
          />
        ) : null}
        {onSecondary ? (
          <SecondaryButton
            label={secondaryLabel}
            onPress={onSecondary}
            accessibilityLabel={secondaryLabel}
            fullWidth
            outline
          />
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: space.xl,
    paddingVertical: space.xl,
    minHeight: 280,
  },
  group: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    gap: space.xs,
  },
  actions: {
    marginTop: space.xl,
  },
  message: {
    marginBottom: space.sm,
  },
  primary: {
    marginTop: space.xs,
    marginBottom: space.xxs,
  },
})
