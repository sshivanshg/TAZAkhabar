import { Component, type ErrorInfo, type ReactNode, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTheme } from '../preferences/ThemePreferenceContext'
import { type AppColors } from '../theme/tokens'
import { ErrorState } from './ui/ErrorState'

type Props = {
  children: ReactNode
  /** Optional label for debugging which screen failed */
  name?: string
  fallbackTitle?: string
  fallbackMessage?: string
  onBackToFeed?: () => void
}

type State = {
  error: Error | null
}

type FallbackProps = {
  title: string
  message: string
  onRetry: () => void
  onBackToFeed?: () => void
}

function ScreenErrorFallback({ title, message, onRetry, onBackToFeed }: FallbackProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <View style={styles.root}>
      <ErrorState
        title={title}
        message={message}
        onRetry={onRetry}
        retryLabel="Try again"
        onSecondary={onBackToFeed}
        secondaryLabel="Back to feed"
      />
    </View>
  )
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: c.background,
    },
  })
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
      console.error(
        `[ScreenErrorBoundary${this.props.name ? `:${this.props.name}` : ''}]`,
        error,
        info.componentStack,
      )
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
      <ScreenErrorFallback
        title={title}
        message={message}
        onRetry={this.reset}
        onBackToFeed={this.props.onBackToFeed}
      />
    )
  }
}
