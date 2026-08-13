import { Component, type ErrorInfo, type ReactNode } from 'react'
import { StyleSheet, View } from 'react-native'
import { colors } from '../theme/tokens'
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
      <View style={styles.root}>
        <ErrorState
          title={title}
          message={message}
          onRetry={this.reset}
          retryLabel="Try again"
          onSecondary={this.props.onBackToFeed}
          secondaryLabel="Back to feed"
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
})
