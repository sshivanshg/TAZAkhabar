import { Platform } from 'react-native'
import * as Haptics from 'expo-haptics'

/** Calm haptic helpers. No-ops on web; never throw. */
export function hapticSelection(): void {
  if (Platform.OS === 'web') return
  try {
    void Haptics.selectionAsync().catch(() => {})
  } catch {
    // ignore
  }
}

export function hapticLight(): void {
  if (Platform.OS === 'web') return
  try {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
  } catch {
    // ignore
  }
}

export function hapticSuccess(): void {
  if (Platform.OS === 'web') return
  try {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
  } catch {
    // ignore
  }
}
