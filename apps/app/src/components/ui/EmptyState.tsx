import { type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { Text } from '@gluestack-ui/themed'
import { Card } from './Card'
import { PrimaryButton, SecondaryButton } from './PrimaryButton'
import { colors, space, typography } from '../../theme/tokens'

type Props = {
  title: string
  message: string
  primaryLabel: string
  onPrimary: () => void
  primaryAccessibilityLabel?: string
  secondaryLabel?: string
  onSecondary?: () => void
  secondaryAccessibilityLabel?: string
  icon?: ReactNode
}

/**
 * Shared empty state used when there is no content to show yet.
 * Keeps the fallback action hierarchy consistent across feed, discover, and bookmarks.
 */
export function EmptyState({
  title,
  message,
  primaryLabel,
  onPrimary,
  primaryAccessibilityLabel,
  secondaryLabel,
  onSecondary,
  secondaryAccessibilityLabel,
  icon,
}: Props) {
  return (
    <View style={styles.outer}>
      <Card>
        <View style={styles.inner}>
          {icon ? <View style={styles.iconWrap}>{icon}</View> : null}
          <Text
            fontSize={typography.headlineSm.fontSize}
            lineHeight={typography.headlineSm.lineHeight}
            fontWeight="$semibold"
            color={colors.text}
            textAlign="center"
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
          <PrimaryButton
            label={primaryLabel}
            onPress={onPrimary}
            accessibilityLabel={primaryAccessibilityLabel ?? primaryLabel}
            fullWidth
          />
          {secondaryLabel && onSecondary ? (
            <SecondaryButton
              label={secondaryLabel}
              onPress={onSecondary}
              accessibilityLabel={secondaryAccessibilityLabel ?? secondaryLabel}
              fullWidth
              outline
              style={styles.secondary}
            />
          ) : null}
        </View>
      </Card>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: space.screen,
    paddingVertical: space.xl,
  },
  inner: {
    paddingHorizontal: space.lg,
    paddingVertical: space.xl,
    alignItems: 'center',
    gap: space.xs,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xs,
  },
  message: {
    marginBottom: space.xs,
  },
  secondary: {
    marginTop: space.xxs,
  },
})
