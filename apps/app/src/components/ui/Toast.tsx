import { useEffect, useRef, useState, type JSX } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { MotiView } from 'moti'
import { useMotionTransition } from '../../hooks/usePrefersReducedMotion'
import { iconPress } from '../../lib/pressFeedback'
import { useTheme } from '../../preferences/ThemePreferenceContext'
import { HIT_TARGET, radius, space } from '../../theme/tokens'

export type ToastOptions = {
  message: string
  actionLabel?: string
  onAction?: () => void
  durationMs?: number
}

type ActiveToast = ToastOptions & { id: number }

const DEFAULT_DURATION_MS = 3500
/** Lifts the toast above the bottom tab bar while staying in thumb reach. */
const TAB_BAR_OFFSET = 72

let nextId = 1
let listener: ((toast: ActiveToast | null) => void) | null = null

/** Show a short confirmation above the tab bar. Replaces any visible toast. */
export function showToast(opts: ToastOptions): void {
  listener?.({ ...opts, id: nextId++ })
}

/** Mount once in the root layout. */
export function ToastHost(): JSX.Element {
  const [toast, setToast] = useState<ActiveToast | null>(null)
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const transition = useMotionTransition({ type: 'timing', duration: 180 })

  useEffect(() => {
    listener = setToast
    return () => {
      if (listener === setToast) listener = null
    }
  }, [])

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    if (!toast) return
    timer.current = setTimeout(() => setToast(null), toast.durationMs ?? DEFAULT_DURATION_MS)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [toast])

  return (
    <View
      pointerEvents="box-none"
      style={[styles.host, { bottom: insets.bottom + TAB_BAR_OFFSET }]}
      accessibilityLiveRegion="polite"
    >
      {toast ? (
        <MotiView
          key={toast.id}
          from={{ opacity: 0, translateY: 8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={transition}
          testID="toast"
          accessibilityRole="alert"
          style={[styles.toast, { backgroundColor: colors.text }]}
        >
          <Text style={[styles.message, { color: colors.background }]}>{toast.message}</Text>
          {toast.actionLabel && toast.onAction ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={toast.actionLabel}
              hitSlop={8}
              onPress={() => {
                toast.onAction?.()
                setToast(null)
              }}
              style={({ pressed }) => [styles.action, iconPress(pressed)]}
            >
              <Text style={[styles.actionText, { color: colors.background }]}>
                {toast.actionLabel}
              </Text>
            </Pressable>
          ) : null}
        </MotiView>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: space.md,
    right: space.md,
    alignItems: 'center',
  },
  toast: {
    width: '100%',
    maxWidth: 480,
    minHeight: HIT_TARGET + 8,
    borderRadius: radius.md,
    paddingLeft: space.md,
    paddingRight: space.xs,
    paddingVertical: space.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  message: { flex: 1, fontSize: 16, lineHeight: 22, fontWeight: '500' },
  action: {
    minHeight: HIT_TARGET,
    minWidth: HIT_TARGET,
    paddingHorizontal: space.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: { fontSize: 16, fontWeight: '700', textDecorationLine: 'underline' },
})
