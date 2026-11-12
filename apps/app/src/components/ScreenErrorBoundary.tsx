import { Component, type ErrorInfo, type ReactNode, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { useTheme } from '../preferences/ThemePreferenceContext'
import { type AppColors } from '../theme/tokens'
import { ErrorState } from './ui/ErrorState'
import { useT } from '../i18n'

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
  title?: string
  message?: string
  onRetry: () => void
  onBackToFeed?: () => void
}

function ScreenErrorFallback({ title, message, onRetry, onBackToFeed }: FallbackProps) {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const t = useT()

  return (
    <View style={styles.root}>
      <ErrorState
        title={title ?? t('common.somethingWentWrong')}
        message={message ?? t('errorBoundary.message')}
        onRetry={onRetry}
        retryLabel={t('common.tryAgain')}
        onSecondary={onBackToFeed}
        secondaryLabel={t('error.backToFeed')}
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

    const title = this.props.fallbackTitle
    const message = this.props.fallbackMessage

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
