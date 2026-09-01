import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

export const NOTIFICATION_CLIENT_ID_KEY = 'tazakhabar.notificationClientId.v1'
export const NOTIFICATION_PROMPT_STATE_KEY = 'tazakhabar.notificationPromptState.v1'

export type NotificationPlatform = 'native' | 'web'
export type NotificationDeliveryMode = 'breaking' | 'daily-digest'

export type NotificationPromptStatus = 'unknown' | 'granted' | 'denied' | 'dismissed'

export interface NotificationPromptState {
  status: NotificationPromptStatus
  lastPromptAt: string | null
  lastDismissedAt: string | null
}

const DEFAULT_PROMPT_STATE: NotificationPromptState = {
  status: 'unknown',
  lastPromptAt: null,
  lastDismissedAt: null,
}

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '')
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`
}

export async function getOrCreateNotificationClientId(): Promise<string> {
  try {
    const existing = await AsyncStorage.getItem(NOTIFICATION_CLIENT_ID_KEY)
    if (existing) {
      return existing
    }
    const created = randomId()
    await AsyncStorage.setItem(NOTIFICATION_CLIENT_ID_KEY, created)
    return created
  } catch {
    return randomId()
  }
}

export async function getNotificationPromptState(): Promise<NotificationPromptState> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATION_PROMPT_STATE_KEY)
    if (!raw) {
      return DEFAULT_PROMPT_STATE
    }
    const parsed = JSON.parse(raw) as Partial<NotificationPromptState>
    if (!parsed || typeof parsed !== 'object') {
      return DEFAULT_PROMPT_STATE
    }
    return {
      status:
        parsed.status === 'granted' || parsed.status === 'denied' || parsed.status === 'dismissed'
          ? parsed.status
          : 'unknown',
      lastPromptAt: typeof parsed.lastPromptAt === 'string' ? parsed.lastPromptAt : null,
      lastDismissedAt: typeof parsed.lastDismissedAt === 'string' ? parsed.lastDismissedAt : null,
    }
  } catch {
    return DEFAULT_PROMPT_STATE
  }
}

export async function setNotificationPromptState(state: NotificationPromptState): Promise<void> {
  await AsyncStorage.setItem(NOTIFICATION_PROMPT_STATE_KEY, JSON.stringify(state))
}

export function getNotificationPlatform(): NotificationPlatform {
  return Platform.OS === 'web' ? 'web' : 'native'
}

export function shouldRePromptForNotifications(state: NotificationPromptState, cooldownDays = 7): boolean {
  if (state.status === 'granted' || state.status === 'denied') {
    return false
  }

  if (!state.lastDismissedAt) {
    return true
  }

  const dismissedAt = Date.parse(state.lastDismissedAt)
  if (Number.isNaN(dismissedAt)) {
    return true
  }

  return Date.now() - dismissedAt >= cooldownDays * 24 * 60 * 60 * 1000
}
