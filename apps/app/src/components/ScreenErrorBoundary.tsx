import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from '@gluestack-ui/themed'
import { colors, radius, space, typography } from '../theme/tokens'

type Props = {
  children: ReactNode
  /** Optional label for debugging which screen failed */
  name?: string
  fallbackTitle?: string
  fallbackMessage?: string
}

type State = {
  error: Error | null
}

/**
 * Catches render errors so one broken subtree does not blank the whole app.
 * Class component is required — React error boundaries cannot be hooks.
 */
export class ScreenErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (__DEV__) {
      // Surfaced in the Metro / browser console for diagnosis
      console.error(`[ScreenErrorBoundary${this.props.name ? `:${this.props.name}` : ''}]`, error, info.componentStack)
    }
  }

  private reset = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (!error) {
      return this.props.children
    }

    const title = this.props.fallbackTitle ?? 'Something went wrong'
    const message =
      this.props.fallbackMessage ??
      'This section hit an unexpected error. You can try again without leaving the app.'

    return (
      <View style={styles.root} accessibilityRole="alert">
        <Text
          fontSize={typography.section.fontSize}
          lineHeight={typography.section.lineHeight}
          fontWeight="$bold"
          color={colors.text}
          mb="$2"
        >
          {title}
        </Text>
        <Text
          fontSize={typography.summary.fontSize}
          lineHeight={typography.summary.lineHeight}
          color={colors.textSecondary}
          mb="$5"
        >
          {message}
        </Text>
        <Pressable
          onPress={this.reset}
          accessibilityRole="button"
          accessibilityLabel="Try again"
          style={({ pressed }) => [styles.button, pressed ? styles.pressed : null]}
        >
          <Text
            fontSize={typography.button.fontSize}
            lineHeight={typography.button.lineHeight}
            fontWeight="$semibold"
            color={colors.textOnAccent}
          >
            Try again
          </Text>
        </Pressable>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: space.xl,
    paddingVertical: space.xxl,
    backgroundColor: colors.background,
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    minHeight: 48,
    paddingHorizontal: space.lg,
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: colors.accentPressed,
  },
})
